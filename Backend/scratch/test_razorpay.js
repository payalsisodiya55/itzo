import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

console.log('Testing Razorpay with keys:', { KEY_ID, KEY_SECRET: KEY_SECRET ? '***' : 'MISSING' });

if (!KEY_ID || !KEY_SECRET) {
    console.error('Missing Razorpay keys in .env');
    process.exit(1);
}

const instance = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });

try {
    const order = await instance.orders.create({
        amount: 100, // 1 INR
        currency: 'INR',
        receipt: 'test_receipt_123'
    });
    console.log('Order created successfully:', order.id);
} catch (error) {
    console.error('Razorpay Error:', error);
}
