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
    console.log("Connecting to MongoDB URI:", uri.replace(/:([^@]+)@/, ':****@'));
    
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    // Let's find one subscription document
    const sub = await UserSubscription.findOne({ status: 'active' });
    if (!sub) {
        console.log("No active subscription found in DB to test on. Let's find any subscription.");
        const anySub = await UserSubscription.findOne({});
        if (!anySub) {
            console.log("No subscription found at all!");
            await mongoose.disconnect();
            return;
        }
        console.log("Found subscription:", {
            id: anySub._id,
            status: anySub.status,
            autoRenew: anySub.autoRenew,
            cancelAtCycleEnd: anySub.cancelAtCycleEnd
        });
        await mongoose.disconnect();
        return;
    }

    console.log("Found active subscription before update:", {
        id: sub._id,
        autoRenew: sub.autoRenew,
        cancelAtCycleEnd: sub.cancelAtCycleEnd,
        cancelAt: sub.cancelAt
    });

    // Mutate and save
    const originalAutoRenew = sub.autoRenew;
    sub.autoRenew = !originalAutoRenew;
    sub.cancelAtCycleEnd = true;
    sub.cancelAt = new Date();

    console.log("Saving changes via sub.save()...");
    const saveResult = await sub.save();
    console.log("Save returned document autoRenew:", saveResult.autoRenew);

    // Fetch fresh from DB
    const freshSub = await UserSubscription.findById(sub._id);
    console.log("Freshly fetched subscription from MongoDB:", {
        id: freshSub._id,
        autoRenew: freshSub.autoRenew,
        cancelAtCycleEnd: freshSub.cancelAtCycleEnd,
        cancelAt: freshSub.cancelAt
    });

    // Revert changes
    console.log("Reverting changes...");
    freshSub.autoRenew = originalAutoRenew;
    freshSub.cancelAtCycleEnd = false;
    freshSub.cancelAt = undefined;
    await freshSub.save();
    console.log("Revert complete.");

    await mongoose.disconnect();
}

run().catch(err => {
    console.error("Error during script execution:", err);
    mongoose.disconnect();
});
