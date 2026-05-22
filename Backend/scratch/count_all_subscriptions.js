import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set DNS servers:", e.message);
}

import 'dotenv/config';
import mongoose from 'mongoose';
import { UserSubscription } from '../src/modules/food/user/models/userSubscription.model.js';

async function run() {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const count = await UserSubscription.countDocuments({});
    console.log("Total user subscriptions in collection:", count);

    const allSubs = await UserSubscription.find({});
    console.log("\nALL SUBSCRIPTIONS IN DATABASE:");
    allSubs.forEach((sub, idx) => {
        console.log(`[${idx}]`, {
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
            updatedAt: sub.updatedAt
        });
    });

    await mongoose.disconnect();
}

run().catch(err => {
    console.error("Error:", err);
    mongoose.disconnect();
});
