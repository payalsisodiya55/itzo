import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        token: {
            type: String,
            required: true,
            unique: true
        },
        device: {
            type: String,
            required: false,
            default: null
        },
        ipAddress: {
            type: String,
            required: false,
            default: null
        },
        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        collection: 'food_refresh_tokens',
        timestamps: true
    }
);

// TTL index for automatic expiration
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const FoodRefreshToken = mongoose.model('FoodRefreshToken', refreshTokenSchema);

