import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set DNS servers:", e.message);
}

import 'dotenv/config';
import mongoose from 'mongoose';
import { UserSubscription } from '../src/modules/food/user/models/userSubscription.model.js';
import { ProcessedWebhookEvent } from '../src/core/payments/models/processedWebhookEvent.model.js';

async function run() {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const subs = await UserSubscription.find({}).sort({ updatedAt: -1 }).limit(10);
    console.log(`\n--- LAST 10 SUBSCRIPTIONS ---`);
    for (const sub of subs) {
        console.log({
            _id: sub._id,
            userType: sub.userType,
            restaurantId: sub.restaurantId,
            deliveryBoyId: sub.deliveryBoyId,
            status: sub.status,
            autoRenew: sub.autoRenew,
            cancelAtCycleEnd: sub.cancelAtCycleEnd,
            cancelAt: sub.cancelAt,
            razorpaySubscriptionId: sub.razorpaySubscriptionId,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
            metadata: sub.metadata
        });
    }

    const events = await ProcessedWebhookEvent.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`\n--- LAST 10 PROCESSED WEBHOOK EVENTS ---`);
    for (const event of events) {
        console.log({
            _id: event._id,
            source: event.source,
            dedupeKey: event.dedupeKey,
            eventId: event.eventId,
            eventType: event.eventType,
            entityType: event.entityType,
            entityId: event.entityId,
            createdAt: event.createdAt
        });
    }

    await mongoose.disconnect();
}

run().catch(err => {
    console.error("Error:", err);
    mongoose.disconnect();
});
