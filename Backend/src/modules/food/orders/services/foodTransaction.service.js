import { FoodTransaction } from '../models/foodTransaction.model.js';
import { FoodRestaurantCommission } from '../../admin/models/restaurantCommission.model.js';
import { FoodDeliveryCommissionRule } from '../../admin/models/deliveryCommissionRule.model.js';
import mongoose from 'mongoose';

const RESTAURANT_COMMISSION_CACHE_MS = 60 * 1000;
let restaurantCommissionRulesCache = null;
let restaurantCommissionRulesLoadedAt = 0;

const DELIVERY_COMMISSION_CACHE_MS = 10 * 1000;
let deliveryCommissionRulesCache = null;
let deliveryCommissionRulesLoadedAt = 0;

async function getActiveRestaurantCommissionRules() {
  const now = Date.now();
  if (
    restaurantCommissionRulesCache &&
    now - restaurantCommissionRulesLoadedAt < RESTAURANT_COMMISSION_CACHE_MS
  ) {
    return restaurantCommissionRulesCache;
  }

  const list = await FoodRestaurantCommission.find({
    status: { $ne: false },
  }).lean();
  restaurantCommissionRulesCache = list || [];
  restaurantCommissionRulesLoadedAt = now;
  return restaurantCommissionRulesCache;
}

export function computeRestaurantCommissionAmount(baseAmount, rule) {
  const safeBase = Math.max(0, Number(baseAmount) || 0);
  if (!Number.isFinite(safeBase) || safeBase < 0) return 0;

  const commissionType = rule?.defaultCommission?.type || 'percentage';
  const commissionValue = Math.max(
    0,
    Number(rule?.defaultCommission?.value ?? 0) || 0
  );

  let commissionAmount = 0;
  if (commissionType === 'percentage') {
    commissionAmount = safeBase * (commissionValue / 100);
  } else if (commissionType === 'amount') {
    commissionAmount = commissionValue;
  }

  // Round to 2 decimals and clamp to [0, base]
  commissionAmount = Math.round((commissionAmount || 0) * 100) / 100;
  commissionAmount = Math.max(0, Math.min(commissionAmount, safeBase));

  return { commissionAmount, commissionType, commissionValue, baseAmount: safeBase };
}

export async function getRestaurantCommissionSnapshot(orderDoc) {
  const baseAmount = Number(orderDoc?.pricing?.subtotal ?? 0) || 0;
  const restaurantIdRaw =
    orderDoc?.restaurantId?._id ?? orderDoc?.restaurantId ?? null;

  if (!restaurantIdRaw) {
    return {
      commissionAmount: 0,
      commissionType: 'percentage',
      commissionValue: 0,
      baseAmount,
    };
  }

  const rules = await getActiveRestaurantCommissionRules();
  const rule =
    rules.find((r) => String(r.restaurantId) === String(restaurantIdRaw)) ||
    // Fallback: accept legacy docs where restaurantId may be stored under `restaurant` / `restaurant_id`
    rules.find((r) => String(r.restaurant || r.restaurant_id || '') === String(restaurantIdRaw)) ||
    null;

  if (!rule) {
    return {
      commissionAmount: 0,
      commissionType: 'percentage',
      commissionValue: 0,
      baseAmount,
    };
  }

  return computeRestaurantCommissionAmount(baseAmount, rule);
}

export async function getActiveCommissionRules() {
  const now = Date.now();
  if (
    deliveryCommissionRulesCache &&
    now - deliveryCommissionRulesLoadedAt < DELIVERY_COMMISSION_CACHE_MS
  ) {
    return deliveryCommissionRulesCache;
  }
  const list = await FoodDeliveryCommissionRule.find({
    status: { $ne: false },
  }).lean();
  deliveryCommissionRulesCache = list || [];
  deliveryCommissionRulesLoadedAt = now;
  return deliveryCommissionRulesCache;
}

export async function getRiderEarning(distanceKm) {
  const d = Number(distanceKm);
  if (!Number.isFinite(d) || d < 0) return 0;
  const rules = await getActiveCommissionRules();
  if (!rules.length) return 0;

  const sorted = [...rules].sort(
    (a, b) => (a.minDistance || 0) - (b.minDistance || 0),
  );
  const baseRule = sorted.find((r) => Number(r.minDistance || 0) === 0) || null;
  if (!baseRule) return 0;

  let earning = Number(baseRule.basePayout || 0);

  for (const r of sorted) {
    const perKm = Number(r.commissionPerKm || 0);
    if (!Number.isFinite(perKm) || perKm <= 0) continue;
    const min = Number(r.minDistance || 0);
    const max = r.maxDistance == null ? null : Number(r.maxDistance);
    if (d <= min) continue;
    const upper = max == null ? d : Math.min(d, max);
    const kmInSlab = Math.max(0, upper - min);
    if (kmInSlab > 0) {
      earning += kmInSlab * perKm;
    }
  }

  if (!Number.isFinite(earning) || earning <= 0) return 0;
  return Math.round(earning);
}

/**
 * Creates an initial 'pending' transaction when an order is created.
 */
export async function createInitialTransaction(order) {
    const { commissionAmount } = await getRestaurantCommissionSnapshot(order);
    const normalizedOrderType = ['food', 'quick', 'mixed'].includes(String(order?.orderType || ''))
        ? String(order.orderType)
        : 'food';
    const restaurantId = order?.restaurantId || null;
    
    // Split logic
    const totalCustomerPaid = order.pricing?.total || 0;
    const riderShare = order.riderEarning || 0;
    // Prefer commission already computed & stored on the order (source of truth for this order),
    // fallback to rule snapshot for older orders.
    const restaurantCommissionFromOrder = Number(order.pricing?.restaurantCommission);
    const restaurantCommission =
        Number.isFinite(restaurantCommissionFromOrder) && restaurantCommissionFromOrder > 0
            ? restaurantCommissionFromOrder
            : (commissionAmount || 0);

    // Phase 3A: Segregated calculations for mixed orders
    let restaurantNet = 0;
    let sellerShare = 0;
    let sellerCommission = 0;

    if (order.orderType === 'mixed') {
        const foodSubtotal = (order.items || [])
            .filter(i => i.type === 'food')
            .reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
        
        restaurantNet = foodSubtotal + (order.pricing?.packagingFee || 0) - restaurantCommission;

        // Seller logic (from receivable rules)
        const quickItems = (order.items || []).filter(i => i.type === 'quick');
        // Sum commission and receivable if pre-calculated in Phase 2
        // We'll calculate it here for the ledger based on the items
        sellerCommission = quickItems.reduce((sum, i) => sum + (Number(i.commission) || 0), 0);
        sellerShare = quickItems.reduce((sum, i) => sum + (Number(i.receivable) || 0), 0);
        
        // If items don't have these (unlikely after Ph2), fallback to simple subtotal
        if (sellerShare === 0 && quickItems.length > 0) {
            sellerShare = quickItems.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
        }
    } else {
        restaurantNet = (order.pricing?.subtotal || 0) + (order.pricing?.packagingFee || 0) - restaurantCommission;
        sellerShare = 0;
        sellerCommission = 0;
    }

    const platformNetProfit = (order.pricing?.platformFee || 0) + (order.pricing?.deliveryFee || 0) + restaurantCommission - riderShare;

    const transaction = new FoodTransaction({
        orderId: order._id,
        orderType: normalizedOrderType,

        userId: order.userId,
        restaurantId,
        deliveryPartnerId: order.dispatch?.deliveryPartnerId,
        paymentMethod: order.payment?.method || 'cash',
        status: order.payment?.status === 'paid' ? 'captured' : 'pending',
        payment: {
            method: String(order.payment?.method || 'cash'),
            status: String(order.payment?.status || 'cod_pending'),
            amountDue: Number(order.payment?.amountDue ?? order.pricing?.total ?? 0) || 0,
            razorpay: {
                orderId: String(order.payment?.razorpay?.orderId || ''),
                paymentId: String(order.payment?.razorpay?.paymentId || ''),
                signature: String(order.payment?.razorpay?.signature || ''),
            },
            qr: {
                qrId: String(order.payment?.qr?.qrId || ''),
                imageUrl: String(order.payment?.qr?.imageUrl || ''),
                paymentLinkId: String(order.payment?.qr?.paymentLinkId || ''),
                shortUrl: String(order.payment?.qr?.shortUrl || ''),
                status: String(order.payment?.qr?.status || ''),
                expiresAt: order.payment?.qr?.expiresAt || null,
            }
        },
        pricing: {
            subtotal: Number(order.pricing?.subtotal || 0) || 0,
            tax: Number(order.pricing?.tax || 0) || 0,
            packagingFee: Number(order.pricing?.packagingFee || 0) || 0,
            deliveryFee: Number(order.pricing?.deliveryFee || 0) || 0,
            platformFee: Number(order.pricing?.platformFee || 0) || 0,
            restaurantCommission,
            discount: Number(order.pricing?.discount || 0) || 0,
            total: Number(order.pricing?.total || 0) || 0,
            currency: String(order.pricing?.currency || order.currency || 'INR'),
        },
        amounts: {
            totalCustomerPaid,
            restaurantShare: Math.max(0, restaurantNet),
            sellerShare: Math.max(0, sellerShare),
            sellerCommission: Math.max(0, sellerCommission),
            restaurantCommission,
            riderShare,
            platformNetProfit,
            taxAmount: order.pricing?.tax || 0
        },
        gateway: {
            razorpayOrderId: order.payment?.razorpay?.orderId,
            qrUrl: order.payment?.qr?.imageUrl
        },
        history: [{
            kind: 'created',
            amount: totalCustomerPaid,
            note: 'Initial transaction created with order'
        }]
    });

    await transaction.save();

    // Link back to the order
    try {
        await mongoose.model('FoodOrder').updateOne(
            { _id: order._id },
            { $set: { transactionId: transaction._id } }
        );
    } catch (err) {
        // Log but don't fail transaction if the backlink fails
    }

    return transaction;
}

/**
 * Updates transaction status (captured, settled, etc) and appends to history.
 */
export async function updateTransactionStatus(orderId, kind, details = {}) {
    const query = { orderId };
    const transaction = await FoodTransaction.findOne(query);
    if (!transaction) return null;

    if (details.status) transaction.status = details.status;
    if (details.razorpayPaymentId) transaction.gateway.razorpayPaymentId = details.razorpayPaymentId;
    if (details.razorpaySignature) transaction.gateway.razorpaySignature = details.razorpaySignature;
    
    transaction.history.push({
        kind,
        amount: transaction.amounts.totalCustomerPaid,
        at: new Date(),
        note: details.note || `Transaction updated: ${kind}`,
        recordedBy: { role: details.recordedByRole || 'SYSTEM', id: details.recordedById }
    });

    await transaction.save();
    return transaction;
}

/**
 * Updates the rider in the transaction when an order is accepted.
 */
export async function updateTransactionRider(orderId, riderId) {
    const query = { orderId };
    return await FoodTransaction.findOneAndUpdate(
        query,
        { $set: { deliveryPartnerId: riderId } },
        { new: true }
    );
}

/**
 * Marks restaurant as settled in the finance record.
 */
export async function settleRestaurant(orderId, adminId) {
    return await updateTransactionStatus(orderId, 'settled', {
        status: 'captured', // Ensure it's marked as captured if it was pending cash
        note: 'Restaurant payout settled by admin',
        recordedByRole: 'ADMIN',
        recordedById: adminId
    });
}
