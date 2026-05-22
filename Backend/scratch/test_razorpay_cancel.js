import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set DNS servers:", e.message);
}

import 'dotenv/config';
import { cancelRazorpaySubscription, fetchRazorpaySubscription } from '../src/modules/food/orders/helpers/razorpay.helper.js';

async function run() {
    const subId = 'sub_SsPUyITbVfe3ai';
    console.log(`Testing cancelRazorpaySubscription for ${subId}...`);

    try {
        const cancelRes = await cancelRazorpaySubscription(subId, true);
        console.log("Razorpay Cancel Response:\n", JSON.stringify(cancelRes, null, 2));

        console.log("\nFetching updated subscription details from Razorpay...");
        const fetchRes = await fetchRazorpaySubscription(subId);
        console.log("Updated Razorpay Subscription Details:\n", JSON.stringify(fetchRes, null, 2));
    } catch (err) {
        console.error("Operation failed with error:\n", err);
    }
}

run();
