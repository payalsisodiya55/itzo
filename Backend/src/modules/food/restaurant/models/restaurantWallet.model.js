import mongoose from 'mongoose';

/**
 * RestaurantWallet — tracks the financial balance for each restaurant.
 * Credited when orders are delivered; debited when settlements are processed.
 */
const restaurantWalletSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodRestaurant',
            required: true,
            unique: true
        },
        balance: { type: Number, default: 0 },
        /** Amount locked for pending settlements (cannot be withdrawn) */
        lockedAmount: { type: Number, default: 0, min: 0 },
        /** Lifetime earnings */
        totalEarnings: { type: Number, default: 0, min: 0 },
        /** Total amount already settled/paid out */
        totalSettled: { type: Number, default: 0, min: 0 }
    },
    { collection: 'food_restaurant_wallets', timestamps: true }
);

export const FoodRestaurantWallet = mongoose.model('FoodRestaurantWallet', restaurantWalletSchema, 'food_restaurant_wallets');
