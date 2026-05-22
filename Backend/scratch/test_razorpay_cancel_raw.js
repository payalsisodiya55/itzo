import dns from 'dns';
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.warn("Could not set DNS servers:", e.message);
}

import 'dotenv/config';
import axios from 'axios';

async function run() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const subId = 'sub_SsPUyITbVfe3ai';

    if (!keyId || !keySecret) {
        console.error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in env.");
        return;
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    console.log(`[RAW API] Testing cancel subscription via raw HTTP POST for ${subId}...`);
    try {
        const response = await axios.post(
            `https://api.razorpay.com/v1/subscriptions/${subId}/cancel`,
            { cancel_at_cycle_end: true },
            {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log("Raw Razorpay Cancel Response:\n", JSON.stringify(response.data, null, 2));

        console.log("\n[RAW API] Fetching subscription details...");
        const fetchResponse = await axios.get(
            `https://api.razorpay.com/v1/subscriptions/${subId}`,
            {
                headers: {
                    'Authorization': authHeader
                }
            }
        );
        console.log("Raw Razorpay Fetch Response:\n", JSON.stringify(fetchResponse.data, null, 2));
    } catch (err) {
        console.error("Raw API Request failed:", err.response ? err.response.data : err.message);
    }
}

run();
