import mongoose from 'mongoose';

const foodDeliveryCashDepositSchema = new mongoose.Schema({
    deliveryPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodDeliveryPartner',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'razorpay', 'upi', 'bank_transfer'],
        default: 'cash'
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending',
        index: true
    },
    razorpayOrderId: {
        type: String,
        default: ''
    },
    razorpayPaymentId: String,
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adminNote: String
}, { 
    collection: 'food_delivery_cash_deposits', 
    timestamps: true 
});

foodDeliveryCashDepositSchema.index({ createdAt: -1 });

export const FoodDeliveryCashDeposit = mongoose.model('FoodDeliveryCashDeposit', foodDeliveryCashDepositSchema, 'food_delivery_cash_deposits');
