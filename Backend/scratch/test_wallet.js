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

    // Get collections
    const db = mongoose.connection.db;

    console.log("\n=== DELIVERY PARTNERS ===");
    const partners = await db.collection('food_delivery_partners').find({}).toArray();
    console.log(partners.map(p => ({
        _id: p._id,
        name: p.name,
        phone: p.phone,
        status: p.status
    })));

    console.log("\n=== DELIVERY WALLEETS ===");
    const wallets = await db.collection('food_delivery_wallets').find({}).toArray();
    console.log(wallets);

    console.log("\n=== TRANSACTIONS ===");
    const txns = await db.collection('transactions').find({}).toArray();
    console.log(txns);

    console.log("\n=== WITHDRAWALS ===");
    const withdrawals = await db.collection('food_delivery_withdrawals').find({}).toArray();
    console.log(withdrawals);

    await mongoose.disconnect();
}

run().catch(console.error);
