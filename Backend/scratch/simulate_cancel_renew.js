import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set DNS servers:", e.message);
}

import 'dotenv/config';
import mongoose from 'mongoose';
import { UserSubscription } from '../src/modules/food/user/models/userSubscription.model.js';
import { FoodDeliveryPartner } from '../src/modules/food/delivery/models/deliveryPartner.model.js';
import { SubscriptionPlan } from '../src/modules/food/admin/models/subscriptionPlan.model.js';
import { cancelAutoRenew } from '../src/modules/food/subscriptions/services/subscription.service.js';
import Razorpay from 'razorpay';

// Mock Razorpay subscription cancellation
Object.defineProperty(Razorpay.prototype, 'subscriptions', {
    get() {
        return {
            cancel: async (subId, atCycleEnd) => {
                console.log(`[MOCK RAZORPAY] Cancel called for subscriptionId: ${subId}, atCycleEnd: ${atCycleEnd}`);
                return { id: subId, status: 'cancelled' };
            }
        };
    },
    set(val) {},
    configurable: true
});

async function run() {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    // Setup temp test data
    const tempRiderId = new mongoose.Types.ObjectId();
    const tempPlanId = new mongoose.Types.ObjectId();

    console.log("[SETUP] Creating temp delivery partner and plan...");
    await FoodDeliveryPartner.create({
        _id: tempRiderId,
        name: 'Audit Temp Rider',
        phone: '9999999999',
        status: 'approved'
    });

    await SubscriptionPlan.create({
        _id: tempPlanId,
        name: 'Audit Temp Recurring Plan',
        price: 500,
        durationValue: 1,
        durationUnit: 'MONTH',
        userType: 'DELIVERY_PARTNER',
        paymentType: 'RECURRING',
        razorpayPlanId: 'plan_audit_123',
        isActive: true,
        isDeleted: false
    });

    console.log("[SETUP] Creating active recurring subscription document...");
    const sub = await UserSubscription.create({
        planId: tempPlanId,
        userType: 'DELIVERY_PARTNER',
        deliveryBoyId: tempRiderId,
        status: 'active',
        razorpaySubscriptionId: 'sub_audit_temp_999',
        autoRenew: true,
        cancelAtCycleEnd: false,
        cancelAt: null
    });

    console.log("1. MongoDB State BEFORE cancelAutoRenew is called:", {
        _id: sub._id,
        autoRenew: sub.autoRenew,
        cancelAtCycleEnd: sub.cancelAtCycleEnd,
        cancelAt: sub.cancelAt
    });

    console.log("\n[ACTION] Invoking cancelAutoRenew service...");
    const returnedSub = await cancelAutoRenew(tempRiderId, 'DELIVERY_PARTNER');

    console.log("2. Returned API Response Object (In-Memory):", {
        _id: returnedSub._id,
        autoRenew: returnedSub.autoRenew,
        cancelAtCycleEnd: returnedSub.cancelAtCycleEnd,
        cancelAt: returnedSub.cancelAt
    });

    console.log("\n3. Querying MongoDB immediately after service returns...");
    const persistedSub = await UserSubscription.findById(sub._id);
    console.log("MongoDB State AFTER cancelAutoRenew completed:", {
        _id: persistedSub._id,
        autoRenew: persistedSub.autoRenew,
        cancelAtCycleEnd: persistedSub.cancelAtCycleEnd,
        cancelAt: persistedSub.cancelAt
    });

    // Cleanup
    console.log("\n[CLEANUP] Removing temp test data...");
    await FoodDeliveryPartner.deleteOne({ _id: tempRiderId });
    await SubscriptionPlan.deleteOne({ _id: tempPlanId });
    await UserSubscription.deleteOne({ _id: sub._id });

    await mongoose.disconnect();
}

run().catch(err => {
    console.error("Error during simulation:", err);
    mongoose.disconnect();
});
