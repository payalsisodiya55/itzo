import mongoose from "mongoose";
import { FoodOrder } from "../../orders/models/order.model.js";
import { FoodDeliveryWithdrawal } from "../models/foodDeliveryWithdrawal.model.js";
import { FoodDeliveryCashDeposit } from "../models/foodDeliveryCashDeposit.model.js";
import { FoodDeliveryPartner } from "../models/deliveryPartner.model.js";
import { DeliveryBonusTransaction } from "../../admin/models/deliveryBonusTransaction.model.js";
import { getDeliveryCashLimitSettings } from "../../admin/services/admin.service.js";
import { ValidationError } from "../../../../core/auth/errors.js";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  isRazorpayConfigured,
  verifyPaymentSignature,
} from "../../orders/helpers/razorpay.helper.js";
import { Transaction } from "../../../../core/payments/models/transaction.model.js";
import { getTransactionsByEntity } from "../../../../core/payments/transaction.service.js";
import { FoodDeliveryWallet } from "../models/deliveryWallet.model.js";

/**
 * Enhanced wallet fetch for delivery partners.
 * Integrates:
 * 1. Historical orders (earnings)
 * 2. Admin bonuses
 * 3. Withdrawals (pending/payout)
 * 4. Cash collected vs limit
 */
export const getDeliveryPartnerWalletEnhanced = async (deliveryPartnerId) => {
  if (
    !deliveryPartnerId ||
    !mongoose.Types.ObjectId.isValid(deliveryPartnerId)
  ) {
    throw new ValidationError("Invalid delivery partner ID");
  }

  const partnerId = new mongoose.Types.ObjectId(deliveryPartnerId);
  const partner = await FoodDeliveryPartner.findById(partnerId).lean();
  if (!partner) throw new ValidationError("Delivery partner not found");

  const [
    cashLimitSettings,
    walletDoc,
    totalBonusAgg,
    cashCollectedAgg,
    totalDepositedCashAgg,
    pendingWithdrawalsAgg,
    transactionsResult,
    totalDeliveries,
  ] = await Promise.all([
    getDeliveryCashLimitSettings(),
    FoodDeliveryWallet.findOne({ deliveryPartnerId: partnerId }).lean(),
    DeliveryBonusTransaction.aggregate([
      { $match: { deliveryPartnerId: partnerId } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$amount", 0] } } } },
    ]),
    FoodOrder.aggregate([
      {
        $match: {
          "dispatch.deliveryPartnerId": partnerId,
          orderStatus: "delivered",
          "payment.method": { $in: ["cash", "cod", "cash_on_delivery"] },
        },
      },
      {
        $group: {
          _id: null,
          cashCollected: {
            $sum: {
              $let: {
                vars: {
                  amountDue: { $ifNull: ["$payment.amountDue", 0] },
                  payableAmount: { $ifNull: ["$payableAmount", 0] },
                  totalAmount: { $ifNull: ["$totalAmount", 0] },
                  amount: { $ifNull: ["$amount", 0] },
                  total: { $ifNull: ["$total", 0] },
                  pricingTotal: { $ifNull: ["$pricing.total", 0] },
                  platformFee: { $ifNull: ["$pricing.platformFee", 0] },
                },
                in: {
                  $max: [
                    0,
                    "$$amountDue",
                    "$$payableAmount",
                    "$$totalAmount",
                    "$$amount",
                    "$$total",
                    {
                      $add: [
                        "$$pricingTotal",
                        {
                          $cond: [
                            { $gt: ["$$platformFee", 0] },
                            "$$platformFee",
                            0,
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
    ]),
    FoodDeliveryCashDeposit.aggregate([
      { $match: { deliveryPartnerId: partnerId, status: "Completed" } },
      {
        $group: {
          _id: null,
          depositedCash: { $sum: { $ifNull: ["$amount", 0] } },
        },
      },
    ]),
    FoodDeliveryWithdrawal.aggregate([
      { $match: { deliveryPartnerId: partnerId, status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    getTransactionsByEntity("deliveryBoy", partnerId, { page: 1, limit: 50 }),
    FoodOrder.countDocuments({
      "dispatch.deliveryPartnerId": partnerId,
      orderStatus: "delivered",
    }),
  ]);

  const wallet = walletDoc || {
    balance: 0,
    totalEarnings: 0,
    totalBonus: 0,
    totalSettled: 0,
  };
  const recordedBonus = Number(wallet.totalBonus || 0);
  const aggregatedBonus = Number(totalBonusAgg?.[0]?.total) || 0;
  const effectiveBonus = Math.max(recordedBonus, aggregatedBonus);
  const missingBonusBalance = Math.max(0, effectiveBonus - recordedBonus);

  const grossCashCollected = Number(cashCollectedAgg?.[0]?.cashCollected) || 0;
  const totalDepositedCash =
    Number(totalDepositedCashAgg?.[0]?.depositedCash) || 0;
  const cashInHand = Math.max(0, grossCashCollected - totalDepositedCash);

  const pendingWithdrawals = Number(pendingWithdrawalsAgg?.[0]?.total) || 0;
  const totalCashLimit = Number(cashLimitSettings.deliveryCashLimit) || 0;
  const deliveryWithdrawalLimit =
    Number(cashLimitSettings.deliveryWithdrawalLimit) || 100;

  const effectiveWalletBalance =
    Number(wallet.balance || 0) + missingBonusBalance;
  const pocketBalance = Math.max(
    0,
    effectiveWalletBalance - pendingWithdrawals,
  );

  const transactions = transactionsResult.transactions.map((t) => ({
    id: t._id,
    type:
      t.category === "settlement_payout"
        ? "withdrawal"
        : t.type === "credit"
          ? "payment"
          : "adjustment",
    amount: t.amount,
    status:
      t.status === "completed"
        ? "Completed"
        : t.status === "pending"
          ? "Pending"
          : "Failed",
    date: t.createdAt,
    description: t.description || "Wallet transaction",
    orderId: t.orderId,
    module: t.module,
  }));

  return {
    totalBalance: (wallet.totalEarnings || 0) + effectiveBonus,
    pocketBalance,
    cashInHand,
    totalWithdrawn: wallet.totalSettled || 0,
    pendingWithdrawals,
    totalEarned: wallet.totalEarnings || 0,
    totalBonus: effectiveBonus,
    totalCashLimit,
    availableCashLimit: Math.max(0, totalCashLimit - cashInHand),
    deliveryWithdrawalLimit,
    totalDeliveries: Number(totalDeliveries) || 0,
    transactions,
  };
};

/**
 * Submits a new withdrawal request for a delivery partner.
 */
export const requestDeliveryWithdrawal = async (deliveryPartnerId, payload) => {
  const { amount, bankDetails, paymentMethod = "bank_transfer" } = payload;
  if (!amount || amount < 1) throw new ValidationError("Invalid amount");

  const wallet = await getDeliveryPartnerWalletEnhanced(deliveryPartnerId);
  if (amount < wallet.deliveryWithdrawalLimit) {
    throw new ValidationError(
      `Minimum withdrawal amount is ₹${wallet.deliveryWithdrawalLimit}`,
    );
  }
  if (amount > wallet.pocketBalance) {
    throw new ValidationError("Insufficient balance for this withdrawal");
  }

  const partner = await FoodDeliveryPartner.findById(deliveryPartnerId).lean();
  if (!partner) throw new ValidationError("Delivery partner not found");

  const withdrawal = await FoodDeliveryWithdrawal.create({
    deliveryPartnerId,
    amount,
    paymentMethod,
    bankDetails: bankDetails || {
      accountNumber: partner.bankAccountNumber,
      ifscCode: partner.bankIfscCode,
      bankName: partner.bankName,
      accountHolderName: partner.bankAccountHolderName,
    },
    upiId: partner.upiId,
    upiQrCode: partner.upiQrCode,
    status: "pending",
  });

  return withdrawal;
};

/**
 * Creates a Razorpay order for cash deposit.
 */
export const createDeliveryCashDepositOrder = async (
  deliveryPartnerId,
  amountInr,
) => {
  const amount = Number(amountInr);
  if (!Number.isFinite(amount) || amount < 1) {
    throw new ValidationError("Amount must be at least ₹1");
  }

  const wallet = await getDeliveryPartnerWalletEnhanced(deliveryPartnerId);
  if (amount > wallet.cashInHand) {
    throw new ValidationError("Deposit amount cannot exceed cash in hand");
  }

  const amountPaise = Math.round(amount * 100);
  const receipt = `cash_deposit_${String(deliveryPartnerId).slice(-8)}_${Date.now()}`;

  if (!isRazorpayConfigured()) {
    return {
      razorpay: {
        key: getRazorpayKeyId() || "rzp_test_dummy",
        orderId: `order_dev_${Date.now()}`,
        amount: amountPaise,
        currency: "INR",
      },
    };
  }

  const order = await createRazorpayOrder(amountPaise, "INR", receipt);
  return {
    razorpay: {
      key: getRazorpayKeyId(),
      orderId: String(order.id),
      amount: Number(order.amount) || amountPaise,
      currency: order.currency || "INR",
    },
  };
};

/**
 * Verifies a cash deposit payment.
 */
export const verifyDeliveryCashDepositPayment = async (
  deliveryPartnerId,
  payload = {},
) => {
  const orderId = String(payload?.razorpayOrderId || "").trim();
  const paymentId = String(payload?.razorpayPaymentId || "").trim();
  const signature = String(payload?.razorpaySignature || "").trim();
  const amount = Number(payload?.amount);

  if (!orderId) throw new ValidationError("razorpayOrderId is required");
  if (!paymentId) throw new ValidationError("razorpayPaymentId is required");
  if (!signature && isRazorpayConfigured())
    throw new ValidationError("razorpaySignature is required");
  if (!Number.isFinite(amount) || amount < 1)
    throw new ValidationError("amount is required");

  const existing = await FoodDeliveryCashDeposit.findOne({
    deliveryPartnerId,
    $or: [{ razorpayPaymentId: paymentId }, { razorpayOrderId: orderId }],
  }).lean();

  if (existing?.status === "Completed") {
    return {
      deposit: existing,
      wallet: await getDeliveryPartnerWalletEnhanced(deliveryPartnerId),
    };
  }

  const wallet = await getDeliveryPartnerWalletEnhanced(deliveryPartnerId);
  if (amount > wallet.cashInHand) {
    throw new ValidationError("Deposit amount cannot exceed cash in hand");
  }

  const isValid = isRazorpayConfigured()
    ? verifyPaymentSignature(orderId, paymentId, signature)
    : true;

  if (!isValid) {
    throw new ValidationError("Payment verification failed");
  }

  const deposit = existing
    ? await FoodDeliveryCashDeposit.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            amount,
            paymentMethod: isRazorpayConfigured() ? "razorpay" : "cash",
            status: "Completed",
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
          },
        },
        { new: true },
      )
    : await FoodDeliveryCashDeposit.create({
        deliveryPartnerId,
        amount,
        paymentMethod: isRazorpayConfigured() ? "razorpay" : "cash",
        status: "Completed",
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
      });

  return {
    deposit,
    wallet: await getDeliveryPartnerWalletEnhanced(deliveryPartnerId),
  };
};
