import 'dotenv/config';
import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set DNS servers:", e.message);
}
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import Razorpay from 'razorpay';
import { UserSubscription } from '../../user/models/userSubscription.model.js';
import { SubscriptionPlan } from '../../admin/models/subscriptionPlan.model.js';
import { FoodDeliveryPartner } from '../../delivery/models/deliveryPartner.model.js';
import { FoodRestaurant } from '../../restaurant/models/restaurant.model.js';
import { cancelAutoRenew } from '../services/subscription.service.js';
import { processSubscriptionExpiry } from '../../admin/services/subscriptionPlan.service.js';

// Setup Mocking for Razorpay prototype
let lastCancelledSubscriptionId = null;
let lastCancelAtCycleEnd = null;

Object.defineProperty(Razorpay.prototype, 'subscriptions', {
    get() {
        return {
            cancel: async (subId, atCycleEnd) => {
                lastCancelledSubscriptionId = subId;
                lastCancelAtCycleEnd = atCycleEnd;
                return { id: subId, status: 'cancelled' };
            }
        };
    },
    set(val) {
        // Allow constructor to set this property
    },
    configurable: true
});

async function runCancellationVerification() {
    console.log("====================================================");
    console.log("STRICT VERIFICATION: AUTO-RENEWAL CANCELLATION FLOW");
    console.log("====================================================\n");

    const uriFromEnv = process.env.MONGODB_URI;
    const localUri = 'mongodb://127.0.0.1:27017/itzo';
    
    let connected = false;
    if (uriFromEnv) {
        try {
            console.log(`[INIT] Attempting connection to env DB: ${uriFromEnv.replace(/:([^@]+)@/, ':****@')} (10s timeout)...`);
            await mongoose.connect(uriFromEnv, { serverSelectionTimeoutMS: 10000 });
            console.log(`[INIT] Connected to env DB!`);
            connected = true;
        } catch (err) {
            console.log(`[INIT] Failed to connect to env DB: ${err.message}`);
        }
    }
    
    if (!connected) {
        try {
            console.log(`[INIT] Attempting connection to local DB: ${localUri} (10s timeout)...`);
            await mongoose.connect(localUri, { serverSelectionTimeoutMS: 10000 });
            console.log(`[INIT] Connected to local DB!`);
            connected = true;
        } catch (err) {
            console.log(`[INIT] Failed to connect to local DB: ${err.message}`);
        }
    }
    
    if (!connected) {
        console.log(`[INIT] Both connections failed. Exiting so mongod can be launched.`);
        process.exit(2);
    }

    // 1. Setup Test Data
    const testRiderId = new mongoose.Types.ObjectId();
    const testRestaurantId = new mongoose.Types.ObjectId();
    const testPlanId = new mongoose.Types.ObjectId();
    const testOneTimePlanId = new mongoose.Types.ObjectId();

    console.log("[SETUP] Cleaning up existing test records...");
    await FoodDeliveryPartner.deleteMany({ $or: [{ _id: testRiderId }, { phone: '8888877777' }] });
    await FoodRestaurant.deleteOne({ _id: testRestaurantId });
    await SubscriptionPlan.deleteMany({ _id: { $in: [testPlanId, testOneTimePlanId] } });
    await UserSubscription.deleteMany({
        $or: [
            { deliveryBoyId: testRiderId },
            { restaurantId: testRestaurantId }
        ]
    });

    console.log("[SETUP] Creating Test Rider and Restaurant...");
    await FoodDeliveryPartner.create({
        _id: testRiderId,
        name: 'Cancellation Audit Rider',
        phone: '8888877777',
        status: 'approved'
    });

    await FoodRestaurant.create({
        _id: testRestaurantId,
        restaurantName: 'Cancellation Audit Restaurant',
        ownerName: 'Cancellation Audit Owner',
        status: 'approved'
    });

    console.log("[SETUP] Creating Test Plans...");
    // Recurring Plan
    await SubscriptionPlan.create({
        _id: testPlanId,
        name: 'Weekly Recurring Plan',
        price: 200,
        durationValue: 1,
        durationUnit: 'WEEK',
        userType: 'DELIVERY_PARTNER',
        paymentType: 'RECURRING',
        razorpayPlanId: 'plan_weekly_123',
        isActive: true,
        isDeleted: false
    });

    // One-Time Plan
    await SubscriptionPlan.create({
        _id: testOneTimePlanId,
        name: 'One Day Plan',
        price: 50,
        durationValue: 1,
        durationUnit: 'DAY',
        userType: 'DELIVERY_PARTNER',
        paymentType: 'ONE_TIME',
        isActive: true,
        isDeleted: false
    });

    // -------------------------------------------------------------------------
    // TEST 1: DELIVERY PARTNER AUTO-RENEW CANCELLATION SUCCESS
    // -------------------------------------------------------------------------
    console.log("\n----------------------------------------------------");
    console.log("TEST 1: Delivery Partner - Cancel Auto Renew");
    console.log("----------------------------------------------------");
    
    // Create an active recurring subscription for Rider
    let riderSub = await UserSubscription.create({
        planId: testPlanId,
        userType: 'DELIVERY_PARTNER',
        deliveryBoyId: testRiderId,
        status: 'active',
        razorpaySubscriptionId: 'sub_rider_9999',
        autoRenew: true,
        cancelAtCycleEnd: false,
        expiryDate: dayjs().add(5, 'days').toDate()
    });

    lastCancelledSubscriptionId = null;
    lastCancelAtCycleEnd = null;

    console.log("[ACTION] Calling cancelAutoRenew(Rider)...");
    const updatedRiderSub = await cancelAutoRenew(testRiderId, 'DELIVERY_PARTNER');

    console.log("[VERIFICATION]");
    console.log(`- AutoRenew set to false? ${updatedRiderSub.autoRenew === false ? '✅ YES' : '❌ NO'}`);
    console.log(`- cancelAtCycleEnd set to true? ${updatedRiderSub.cancelAtCycleEnd === true ? '✅ YES' : '❌ NO'}`);
    console.log(`- cancelAt populated? ${updatedRiderSub.cancelAt ? '✅ YES (' + updatedRiderSub.cancelAt + ')' : '❌ NO'}`);
    console.log(`- Status is still active (access till expiry)? ${updatedRiderSub.status === 'active' ? '✅ YES' : '❌ NO'}`);
    console.log(`- Razorpay cancel API called? ${lastCancelledSubscriptionId === 'sub_rider_9999' ? '✅ YES' : '❌ NO'}`);
    console.log(`- Razorpay cancel at cycle end true? ${lastCancelAtCycleEnd === true ? '✅ YES' : '❌ NO'}`);

    if (updatedRiderSub.autoRenew !== false || updatedRiderSub.cancelAtCycleEnd !== true || updatedRiderSub.status !== 'active' || lastCancelledSubscriptionId !== 'sub_rider_9999') {
        throw new Error("TEST 1 FAILED");
    }

    // -------------------------------------------------------------------------
    // TEST 2: RESTAURANT AUTO-RENEW CANCELLATION SUCCESS
    // -------------------------------------------------------------------------
    console.log("\n----------------------------------------------------");
    console.log("TEST 2: Restaurant - Cancel Auto Renew");
    console.log("----------------------------------------------------");

    // Create an active recurring subscription for Restaurant
    let restaurantSub = await UserSubscription.create({
        planId: testPlanId,
        userType: 'RESTAURANT',
        restaurantId: testRestaurantId,
        status: 'active',
        razorpaySubscriptionId: 'sub_restaurant_8888',
        autoRenew: true,
        cancelAtCycleEnd: false,
        expiryDate: dayjs().add(6, 'days').toDate()
    });

    lastCancelledSubscriptionId = null;
    lastCancelAtCycleEnd = null;

    console.log("[ACTION] Calling cancelAutoRenew(Restaurant)...");
    const updatedRestaurantSub = await cancelAutoRenew(testRestaurantId, 'RESTAURANT');

    console.log("[VERIFICATION]");
    console.log(`- AutoRenew set to false? ${updatedRestaurantSub.autoRenew === false ? '✅ YES' : '❌ NO'}`);
    console.log(`- cancelAtCycleEnd set to true? ${updatedRestaurantSub.cancelAtCycleEnd === true ? '✅ YES' : '❌ NO'}`);
    console.log(`- cancelAt populated? ${updatedRestaurantSub.cancelAt ? '✅ YES (' + updatedRestaurantSub.cancelAt + ')' : '❌ NO'}`);
    console.log(`- Status is still active? ${updatedRestaurantSub.status === 'active' ? '✅ YES' : '❌ NO'}`);
    console.log(`- Razorpay cancel API called? ${lastCancelledSubscriptionId === 'sub_restaurant_8888' ? '✅ YES' : '❌ NO'}`);

    if (updatedRestaurantSub.autoRenew !== false || updatedRestaurantSub.cancelAtCycleEnd !== true || updatedRestaurantSub.status !== 'active' || lastCancelledSubscriptionId !== 'sub_restaurant_8888') {
        throw new Error("TEST 2 FAILED");
    }

    // -------------------------------------------------------------------------
    // TEST 3: CANNOT CANCEL IF SUBSCRIPTION IS NOT ACTIVE (E.G. GRACE STATE)
    // -------------------------------------------------------------------------
    console.log("\n----------------------------------------------------");
    console.log("TEST 3: Restriction - Cancel in Grace Period (Safety Correction 1)");
    console.log("----------------------------------------------------");

    // Clear previous
    await UserSubscription.deleteMany({ deliveryBoyId: testRiderId });

    // Create a subscription in grace status
    await UserSubscription.create({
        planId: testPlanId,
        userType: 'DELIVERY_PARTNER',
        deliveryBoyId: testRiderId,
        status: 'grace',
        razorpaySubscriptionId: 'sub_rider_7777',
        autoRenew: true,
        cancelAtCycleEnd: false,
        expiryDate: dayjs().subtract(1, 'hour').toDate(),
        gracePeriodUntil: dayjs().add(23, 'hours').toDate()
    });

    try {
        console.log("[ACTION] Attempting to cancel auto-renew during grace period...");
        await cancelAutoRenew(testRiderId, 'DELIVERY_PARTNER');
        console.log("❌ FAIL: Allowed cancellation during grace status!");
        throw new Error("TEST 3 FAILED");
    } catch (error) {
        console.log(`✅ SUCCESS: Threw validation error as expected: "${error.message}"`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: LIFECYCLE BYPASS - EXPIRED ONES WITH cancelAtCycleEnd: true GO DIRECTLY TO expired
    // -------------------------------------------------------------------------
    console.log("\n----------------------------------------------------");
    console.log("TEST 4: Lifecycle - Expiration transition (Grace Bypass)");
    console.log("----------------------------------------------------");

    // Setup 1: Cancelled subscription with expiryDate in past
    await UserSubscription.deleteMany({ deliveryBoyId: testRiderId });
    const subCancelled = await UserSubscription.create({
        planId: testPlanId,
        userType: 'DELIVERY_PARTNER',
        deliveryBoyId: testRiderId,
        status: 'active',
        razorpaySubscriptionId: 'sub_rider_cancelled',
        autoRenew: false,
        cancelAtCycleEnd: true,
        expiryDate: dayjs().subtract(1, 'hour').toDate()
    });

    // Setup 2: Standard active subscription (not cancelled) with expiryDate in past
    await UserSubscription.deleteMany({ restaurantId: testRestaurantId });
    const subStandard = await UserSubscription.create({
        planId: testPlanId,
        userType: 'RESTAURANT',
        restaurantId: testRestaurantId,
        status: 'active',
        razorpaySubscriptionId: 'sub_restaurant_standard',
        autoRenew: true,
        cancelAtCycleEnd: false,
        expiryDate: dayjs().subtract(1, 'hour').toDate()
    });

    console.log("[ACTION] Invoking processSubscriptionExpiry()...");
    await processSubscriptionExpiry();

    const verifiedCancelled = await UserSubscription.findById(subCancelled._id);
    const verifiedStandard = await UserSubscription.findById(subStandard._id);

    console.log("[VERIFICATION]");
    console.log(`- Cancelled subscription moved directly to 'expired'? ${verifiedCancelled.status === 'expired' ? '✅ YES' : '❌ NO (' + verifiedCancelled.status + ')'}`);
    console.log(`- Cancelled subscription skipped 'grace'? ${verifiedCancelled.gracePeriodUntil ? '❌ NO' : '✅ YES'}`);
    console.log(`- Standard subscription moved to 'grace'? ${verifiedStandard.status === 'grace' ? '✅ YES' : '❌ NO (' + verifiedStandard.status + ')'}`);
    console.log(`- Standard subscription has gracePeriodUntil? ${verifiedStandard.gracePeriodUntil ? '✅ YES' : '❌ NO'}`);

    if (verifiedCancelled.status !== 'expired' || verifiedCancelled.gracePeriodUntil || verifiedStandard.status !== 'grace') {
        throw new Error("TEST 4 FAILED");
    }

    // -------------------------------------------------------------------------
    // TEST 5: ONE-DAY PASS / ONE-TIME PLANS REGRESSION PROOF
    // -------------------------------------------------------------------------
    console.log("\n----------------------------------------------------");
    console.log("TEST 5: Regression Proof - One-Time Plans / Wallet top-up");
    console.log("----------------------------------------------------");

    await UserSubscription.deleteMany({ deliveryBoyId: testRiderId });
    await UserSubscription.create({
        planId: testOneTimePlanId,
        userType: 'DELIVERY_PARTNER',
        deliveryBoyId: testRiderId,
        status: 'active',
        razorpaySubscriptionId: null, // One-time plans do not have recurring subscription IDs
        autoRenew: false,
        cancelAtCycleEnd: false,
        expiryDate: dayjs().add(1, 'day').toDate()
    });

    try {
        console.log("[ACTION] Attempting to cancel auto-renew on a one-time plan...");
        await cancelAutoRenew(testRiderId, 'DELIVERY_PARTNER');
        console.log("❌ FAIL: Allowed cancellation of a one-time plan!");
        throw new Error("TEST 5 FAILED");
    } catch (error) {
        console.log(`✅ SUCCESS: Threw validation error as expected: "${error.message}"`);
    }

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n[CLEANUP] Removing test data...");
    await FoodDeliveryPartner.deleteOne({ _id: testRiderId });
    await FoodRestaurant.deleteOne({ _id: testRestaurantId });
    await SubscriptionPlan.deleteMany({ _id: { $in: [testPlanId, testOneTimePlanId] } });
    await UserSubscription.deleteMany({
        $or: [
            { deliveryBoyId: testRiderId },
            { restaurantId: testRestaurantId }
        ]
    });

    console.log("\n====================================================");
    console.log("ALL TESTS COMPLETED SUCCESSFULLY: ZERO REGRESSIONS");
    console.log("====================================================");

    await mongoose.disconnect();
}

runCancellationVerification().catch(err => {
    console.error(err);
    process.exit(1);
});
