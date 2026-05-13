import mongoose from 'mongoose';
import { FoodOrder } from '../models/order.model.js';
import { FoodRestaurant } from '../../restaurant/models/restaurant.model.js';
import { FoodFeeSettings } from '../../admin/models/feeSettings.model.js';
import { FoodOffer } from '../../admin/models/offer.model.js';
import { FoodOfferUsage } from '../../admin/models/offerUsage.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';

function roundCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(2));
}

function calculateBaseDeliveryFeeForDistance(distanceKm, feeSettings) {
  const distance = Number(distanceKm);
  const baseDistance = Number(feeSettings?.baseDistanceKm || 0);
  const baseFee = Number(feeSettings?.baseDeliveryFee ?? feeSettings?.deliveryFee ?? 0);
  const perKmCharge = Number(feeSettings?.perKmCharge || 0);

  if (!Number.isFinite(distance) || distance <= baseDistance) {
    return roundCurrency(Math.max(0, baseFee));
  }

  return roundCurrency(Math.max(0, baseFee + (distance - baseDistance) * perKmCharge));
}

function resolveSponsorRule(subtotal, distanceKm, sponsorRules = []) {
  const safeSubtotal = Number(subtotal);
  const safeDistance = Number(distanceKm);
  if (!Number.isFinite(safeSubtotal) || !Number.isFinite(safeDistance)) return null;

  const normalizedRules = (Array.isArray(sponsorRules) ? sponsorRules : [])
    .map((rule, index) => ({
      index,
      minOrderAmount: Number(rule?.minOrderAmount),
      maxOrderAmount:
        rule?.maxOrderAmount == null || rule?.maxOrderAmount === ''
          ? null
          : Number(rule.maxOrderAmount),
      maxDistanceKm: Number(rule?.maxDistanceKm),
      sponsorType: String(rule?.sponsorType || '').trim().toUpperCase(),
      sponsoredKm:
        rule?.sponsoredKm == null || rule?.sponsoredKm === ''
          ? null
          : Number(rule.sponsoredKm),
    }))
    .filter((rule) =>
      Number.isFinite(rule.minOrderAmount) &&
      Number.isFinite(rule.maxDistanceKm) &&
      ["USER_FULL", "RESTAURANT_FULL", "SPLIT"].includes(rule.sponsorType),
    )
    .sort((a, b) => {
      if (b.minOrderAmount !== a.minOrderAmount) return b.minOrderAmount - a.minOrderAmount;
      if (a.maxDistanceKm !== b.maxDistanceKm) return a.maxDistanceKm - b.maxDistanceKm;
      return a.index - b.index;
    });

  return normalizedRules.find((rule) => {
    const orderOk =
      safeSubtotal >= rule.minOrderAmount &&
      (rule.maxOrderAmount == null || safeSubtotal <= rule.maxOrderAmount);
    return orderOk && safeDistance <= rule.maxDistanceKm;
  }) || null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function calculateOrderPricing(userId, dto) {
  const restaurant = await FoodRestaurant.findById(dto.restaurantId)
    .select("status location")
    .lean();
  if (!restaurant) throw new ValidationError("Restaurant not found");
  if (restaurant.status !== "approved")
    throw new ValidationError("Restaurant not available");

  const items = Array.isArray(dto.items) ? dto.items : [];
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0,
  );

  const feeDoc = await FoodFeeSettings.findOne({ isActive: true })
    .sort({ createdAt: -1 })
    .lean();
  const feeSettings = {
    deliveryFee: 25,
    baseDistanceKm: 3,
    baseDeliveryFee: 25,
    perKmCharge: 10,
    sponsorRules: [],
    platformFee: 5,
    gstRate: 5,
    ...(feeDoc || {}),
  };

  const packagingFee = 0;
  const platformFee = Number(feeSettings.platformFee || 0);

  const restaurantCoords = restaurant?.location?.coordinates;
  const customerCoords = dto?.address?.location?.coordinates;
  const distanceKm =
    Array.isArray(restaurantCoords) &&
    restaurantCoords.length === 2 &&
    Array.isArray(customerCoords) &&
    customerCoords.length === 2
      ? haversineKm(
          Number(restaurantCoords[1]),
          Number(restaurantCoords[0]),
          Number(customerCoords[1]),
          Number(customerCoords[0]),
        )
      : 0;

  const totalDeliveryFee = calculateBaseDeliveryFeeForDistance(distanceKm, feeSettings);
  const matchedRule = resolveSponsorRule(subtotal, distanceKm, feeSettings.sponsorRules);
  let restaurantDeliveryFee = 0;
  let userDeliveryFee = totalDeliveryFee;
  let sponsoredKm = 0;
  let deliverySponsorType = 'USER_FULL';

  if (matchedRule?.sponsorType === 'RESTAURANT_FULL') {
    restaurantDeliveryFee = totalDeliveryFee;
    userDeliveryFee = 0;
    sponsoredKm = roundCurrency(distanceKm);
    deliverySponsorType = 'RESTAURANT_FULL';
  } else if (matchedRule?.sponsorType === 'SPLIT') {
    const safeSponsoredKm = Math.max(0, Math.min(Number(distanceKm || 0), Number(matchedRule.sponsoredKm || 0)));
    restaurantDeliveryFee = Math.min(
      totalDeliveryFee,
      calculateBaseDeliveryFeeForDistance(safeSponsoredKm, feeSettings),
    );
    userDeliveryFee = Math.max(0, roundCurrency(totalDeliveryFee - restaurantDeliveryFee));
    sponsoredKm = roundCurrency(safeSponsoredKm);
    deliverySponsorType = 'SPLIT';
  }
  const deliveryFee = roundCurrency(userDeliveryFee);

  const gstRate = Number(feeSettings.gstRate || 0);
  const tax =
    Number.isFinite(gstRate) && gstRate > 0
      ? Math.round(subtotal * (gstRate / 100))
      : 0;

  let discount = 0;
  let appliedCoupon = null;
  const codeRaw = dto.couponCode
    ? String(dto.couponCode).trim().toUpperCase()
    : "";

  if (codeRaw) {
    const now = new Date();
    const offer = await FoodOffer.findOne({ couponCode: codeRaw }).lean();
    if (offer) {
      const statusOk = offer.status === "active";
      const startOk = !offer.startDate || now >= new Date(offer.startDate);
      const endOk = !offer.endDate || now < new Date(offer.endDate);
      const scopeOk =
        offer.restaurantScope !== "selected" ||
        String(offer.restaurantId || "") === String(dto.restaurantId || "");
      const minOk = subtotal >= (Number(offer.minOrderValue) || 0);
      let usageOk = true;
      if (
        Number(offer.usageLimit) > 0 &&
        Number(offer.usedCount || 0) >= Number(offer.usageLimit)
      ) {
        usageOk = false;
      }

      let perUserOk = true;
      if (userId && Number(offer.perUserLimit) > 0) {
        const usage = await FoodOfferUsage.findOne({
          offerId: offer._id,
          userId,
        }).lean();
        if (usage && Number(usage.count) >= Number(offer.perUserLimit)) {
          perUserOk = false;
        }
      }

      let firstOrderOk = true;
      if (userId && offer.customerScope === "first-time") {
        const c = await FoodOrder.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
        });
        firstOrderOk = c === 0;
      }
      if (userId && offer.isFirstOrderOnly === true) {
        const c2 = await FoodOrder.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
        });
        if (c2 > 0) firstOrderOk = false;
      }

      const allowed =
        statusOk &&
        startOk &&
        endOk &&
        scopeOk &&
        minOk &&
        usageOk &&
        perUserOk &&
        firstOrderOk;

      if (allowed) {
        if (offer.discountType === "percentage") {
          const raw = subtotal * (Number(offer.discountValue) / 100);
          const capped = Number(offer.maxDiscount)
            ? Math.min(raw, Number(offer.maxDiscount))
            : raw;
          discount = Math.max(0, Math.min(subtotal, Math.floor(capped)));
        } else {
          discount = Math.max(
            0,
            Math.min(subtotal, Math.floor(Number(offer.discountValue) || 0)),
          );
        }
        appliedCoupon = { code: codeRaw, discount };
      }
    }
  }

  const total = Math.max(
    0,
    subtotal + packagingFee + deliveryFee + platformFee + tax - discount,
  );

  return {
    pricing: {
      subtotal,
      tax,
      packagingFee,
      deliveryFee,
      totalDeliveryFee: roundCurrency(totalDeliveryFee),
      userDeliveryFee: roundCurrency(userDeliveryFee),
      restaurantDeliveryFee: roundCurrency(restaurantDeliveryFee),
      sponsoredDelivery: roundCurrency(restaurantDeliveryFee) > 0,
      sponsoredKm,
      deliveryDistanceKm: roundCurrency(distanceKm),
      deliverySponsorType,
      platformFee,
      discount,
      total,
      currency: "INR",
      couponCode: appliedCoupon?.code || codeRaw || null,
      appliedCoupon,
    },
  };
}
