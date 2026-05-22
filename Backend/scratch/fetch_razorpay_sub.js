import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set DNS servers:", e.message);
}

import 'dotenv/config';
import { fetchRazorpaySubscription } from '../src/modules/food/orders/helpers/razorpay.helper.js';

async function run() {
    // The subscription ID found in our database
    const subId = 'sub_SsPUyITbVfe3ai';
    console.log(`Fetching subscription ${subId} from Razorpay...`);

    try {
        const res = await fetchRazorpaySubscription(subId);
        console.log("Razorpay Subscription Details:\n", JSON.stringify(res, null, 2));
    } catch (err) {
        console.error("Failed to fetch Razorpay subscription:", err.message);
    }
}

run();
