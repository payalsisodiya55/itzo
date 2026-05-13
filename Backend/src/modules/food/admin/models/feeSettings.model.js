import mongoose from 'mongoose';

const deliverySponsorRuleSchema = new mongoose.Schema(
    {
        minOrderAmount: { type: Number, required: true, min: 0 },
        maxOrderAmount: { type: Number, min: 0, default: null },
        maxDistanceKm: { type: Number, required: true, min: 0 },
        sponsorType: {
            type: String,
            enum: ['USER_FULL', 'RESTAURANT_FULL', 'SPLIT'],
            required: true
        },
        sponsoredKm: { type: Number, min: 0, default: null }
    },
    { _id: false }
);

const feeSettingsSchema = new mongoose.Schema(
    {
        // Legacy alias kept so quick/mixed flows that still read `deliveryFee`
        // continue to work without changing their execution path.
        deliveryFee: { type: Number, min: 0 },
        baseDistanceKm: { type: Number, min: 0 },
        baseDeliveryFee: { type: Number, min: 0 },
        perKmCharge: { type: Number, min: 0 },
        sponsorRules: { type: [deliverySponsorRuleSchema], default: [] },
        platformFee: { type: Number, min: 0 },
        gstRate: { type: Number, min: 0, max: 100 },
        mixedOrderDistanceLimit: { type: Number, min: 0, default: 2 },
        mixedOrderAngleLimit: { type: Number, min: 0, default: 35 },
        isActive: { type: Boolean, default: true, index: true }
    },
    { collection: 'food_fee_settings', timestamps: true }
);

feeSettingsSchema.index({ isActive: 1, createdAt: -1 });

export const FoodFeeSettings = mongoose.model('FoodFeeSettings', feeSettingsSchema, 'food_fee_settings');

