import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set DNS servers:", e.message);
}

import 'dotenv/config';
import mongoose from 'mongoose';
import { ProcessedWebhookEvent } from '../src/core/payments/models/processedWebhookEvent.model.js';

async function run() {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    const events = await ProcessedWebhookEvent.find({}).lean();
    console.log(`Found ${events.length} webhook event(s) in database:`);
    console.log(JSON.stringify(events, null, 2));

    await mongoose.disconnect();
}

run().catch(err => {
    console.error("Error:", err);
    mongoose.disconnect();
});
