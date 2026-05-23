import dns from 'dns';
// Set DNS to Google's public DNS to bypass local SRV resolution blocks
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to", uri);
    await mongoose.connect(uri);

    const db = mongoose.connection.db;

    // Search for order FOD-G9SXK3
    const order = await db.collection('food_orders').findOne({
        $or: [
            { orderId: "FOD-G9SXK3" },
            { order_id: "FOD-G9SXK3" },
            { _id: new mongoose.Types.ObjectId("69fefaf26bd464fdefc1d7be") }
        ]
    });

    console.log("\n=== ORDER DETAILS ===");
    console.log(JSON.stringify(order, null, 2));

    await mongoose.disconnect();
}

run().catch(console.error);
