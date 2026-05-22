import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set DNS servers:", e.message);
}

import 'dotenv/config';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { UserSubscription } from '../src/modules/food/user/models/userSubscription.model.js';
import { SubscriptionPlan } from '../src/modules/food/admin/models/subscriptionPlan.model.js';
import { FoodDeliveryPartner } from '../src/modules/food/delivery/models/deliveryPartner.model.js';
import { cancelAutoRenew, verifyPurchase } from '../src/modules/food/subscriptions/services/subscription.service.js';
import { handleRazorpayWebhook } from '../src/core/payments/controllers/razorpayWebhook.controller.js';
import { config } from '../src/config/env.js';

// Setup Mocking for Razorpay prototype so cancelAutoRenew helper won't fail
import Razorpay from 'razorpay';
Object.defineProperty(Razorpay.prototype, 'subscriptions', {
    get() {
        return {
            cancel: async (subId, atCycleEnd) => {
                return { id: subId, status: 'cancelled' };
            }
        };
    },
    set(val) {},
    configurable: true
});

async function run() {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    // 1. Setup temporary test data
    const tempRiderId = new mongoose.Types.ObjectId();
    const tempPlanId = new mongoose.Types.ObjectId();
    const rzSubId = 'sub_webhook_verify_' + crypto.randomBytes(4).toString('hex');

    console.log("\n--- [SETUP] Creating test records ---");
    const randomPhone = '777' + Math.floor(1000000 + Math.random() * 9000000).toString();
    await FoodDeliveryPartner.create({
        _id: tempRiderId,
        name: 'Webhook Verification Rider',
        phone: randomPhone,
        status: 'approved'
    });

    const plan = await SubscriptionPlan.create({
        _id: tempPlanId,
        name: 'Webhook Verification Plan',
        price: 300,
        durationValue: 1,
        durationUnit: 'MONTH',
        userType: 'DELIVERY_PARTNER',
        paymentType: 'RECURRING',
        razorpayPlanId: 'plan_webhook_verify_123',
        isActive: true,
        isDeleted: false
    });

    console.log("Creating pending subscription doc...");
    const sub = await UserSubscription.create({
        planId: tempPlanId,
        userType: 'DELIVERY_PARTNER',
        deliveryBoyId: tempRiderId,
        status: 'pending',
        razorpaySubscriptionId: rzSubId,
        autoRenew: false,
        cancelAtCycleEnd: false
    });

    // 2. Test Checkout / Verify Purchase Flow (Should set autoRenew: true)
    console.log("\n--- [TEST] Simulating Purchase Verification ---");
    const secretKey = config.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '';
    const signature = crypto
        .createHmac('sha256', secretKey)
        .update('pay_123' + '|' + rzSubId)
        .digest('hex');

    await verifyPurchase(tempRiderId, 'DELIVERY_PARTNER', {
        razorpaySubscriptionId: rzSubId,
        razorpayPaymentId: 'pay_123',
        razorpaySignature: signature
    });

    let freshSub = await UserSubscription.findById(sub._id);
    console.log("Database state after checkout/verifyPurchase:", {
        autoRenew: freshSub.autoRenew,
        cancelAtCycleEnd: freshSub.cancelAtCycleEnd,
        status: freshSub.status
    });

    if (freshSub.autoRenew !== true || freshSub.cancelAtCycleEnd !== false) {
        throw new Error("Checkout verification failed to set autoRenew: true / cancelAtCycleEnd: false");
    }

    // 3. Test cancelAutoRenew service (Should set autoRenew: false, cancelAtCycleEnd: true)
    console.log("\n--- [TEST] Cancelling Auto Renewal ---");
    await cancelAutoRenew(tempRiderId, 'DELIVERY_PARTNER');

    freshSub = await UserSubscription.findById(sub._id);
    console.log("Database state after calling cancelAutoRenew:", {
        autoRenew: freshSub.autoRenew,
        cancelAtCycleEnd: freshSub.cancelAtCycleEnd,
        status: freshSub.status
    });

    if (freshSub.autoRenew !== false || freshSub.cancelAtCycleEnd !== true) {
        throw new Error("cancelAutoRenew service failed to persist autoRenew: false / cancelAtCycleEnd: true");
    }

    // 4. Helper function to simulate webhook execution
    const runWebhookSimulation = async (eventType, payloadEntity) => {
        const bodyObj = {
            entity: 'event',
            account_id: 'acc_123',
            event: eventType,
            id: 'evt_' + crypto.randomBytes(4).toString('hex'),
            payload: {
                subscription: {
                    entity: {
                        id: rzSubId,
                        status: 'active',
                        plan_id: plan.razorpayPlanId,
                        notes: {
                            type: 'subscription'
                        },
                        ...payloadEntity
                    }
                }
            },
            created_at: Math.floor(Date.now() / 1000)
        };

        const rawBodyStr = JSON.stringify(bodyObj);
        const webhookSecret = config.razorpayWebhookSecret || 'webhook_secret';
        
        const sig = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBodyStr)
            .digest('hex');

        const req = {
            headers: {
                'x-razorpay-signature': sig,
                'x-razorpay-event-id': bodyObj.id
            },
            body: bodyObj,
            rawBody: Buffer.from(rawBodyStr)
        };

        let statusSent = null;
        let responseBody = null;
        const res = {
            status: (code) => {
                statusSent = code;
                return {
                    send: (msg) => { responseBody = msg; },
                    json: (obj) => { responseBody = obj; }
                };
            }
        };

        await handleRazorpayWebhook(req, res);
        console.log(`Webhook [${eventType}] response status:`, statusSent);
    };

    // 5. Simulate subscription.activated Webhook (Should NOT overwrite cancellation status)
    console.log("\n--- [TEST] Simulating Delayed subscription.activated Webhook ---");
    await runWebhookSimulation('subscription.activated', {});

    freshSub = await UserSubscription.findById(sub._id);
    console.log("Database state after subscription.activated Webhook:", {
        autoRenew: freshSub.autoRenew,
        cancelAtCycleEnd: freshSub.cancelAtCycleEnd,
        status: freshSub.status
    });

    if (freshSub.autoRenew !== false || freshSub.cancelAtCycleEnd !== true) {
        throw new Error("Regression! Webhook subscription.activated overwrote the cancelled state!");
    }
    console.log("✅ Webhook subscription.activated did not overwrite the cancelled state!");

    // 6. Simulate subscription.charged Webhook (Should NOT overwrite cancellation status)
    console.log("\n--- [TEST] Simulating subscription.charged Webhook ---");
    await runWebhookSimulation('subscription.charged', {});

    freshSub = await UserSubscription.findById(sub._id);
    console.log("Database state after subscription.charged Webhook:", {
        autoRenew: freshSub.autoRenew,
        cancelAtCycleEnd: freshSub.cancelAtCycleEnd,
        status: freshSub.status
    });

    if (freshSub.autoRenew !== false || freshSub.cancelAtCycleEnd !== true) {
        throw new Error("Regression! Webhook subscription.charged overwrote the cancelled state!");
    }
    console.log("✅ Webhook subscription.charged did not overwrite the cancelled state!");

    // 7. Cleanup
    console.log("\n--- [CLEANUP] Removing test records ---");
    await FoodDeliveryPartner.deleteOne({ _id: tempRiderId });
    await SubscriptionPlan.deleteOne({ _id: tempPlanId });
    await UserSubscription.deleteOne({ _id: sub._id });

    await mongoose.disconnect();
    console.log("Disconnected. Test completed successfully with ZERO regressions!");
}

run().catch(err => {
    console.error("Test failed:", err);
    mongoose.disconnect();
    process.exit(1);
});
