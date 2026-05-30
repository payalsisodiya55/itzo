import mongoose from 'mongoose';

const foodWishlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodUser',
            required: true,
            unique: true,
        },
        dishes: [
            {
                restaurantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'FoodRestaurant',
                    required: true,
                },
                restaurantName: {
                    type: String,
                    required: true,
                },
                restaurantSlug: {
                    type: String,
                    required: true,
                },
                dishName: {
                    type: String,
                    required: true,
                },
                price: {
                    type: Number,
                },
                savedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        collection: 'food_wishlists',
        timestamps: true,
    }
);

// Index for fast lookup by userId
foodWishlistSchema.index({ userId: 1 });

export const FoodWishlist = mongoose.model('FoodWishlist', foodWishlistSchema, 'food_wishlists');
