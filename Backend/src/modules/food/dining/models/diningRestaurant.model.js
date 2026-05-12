import mongoose from 'mongoose';

const diningRestaurantSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodRestaurant',
            required: true
        },
        categoryIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'FoodDiningCategory'
            }
        ],
        primaryCategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodDiningCategory',
            default: null
        },
        isEnabled: {
            type: Boolean,
            default: false
        },
        maxGuests: {
            type: Number,
            default: 6,
            min: 0
        },
        pendingRequest: {
            isEnabled: {
                type: Boolean,
                default: undefined
            },
            maxGuests: {
                type: Number,
                min: 0,
                default: undefined
            },
            categoryIds: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'FoodDiningCategory'
                }
            ],
            primaryCategoryId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'FoodDiningCategory',
                default: null
            },
            requestedAt: {
                type: Date,
                default: null
            },
            note: {
                type: String,
                trim: true,
                default: ''
            }
        },
        pureVegRestaurant: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        collection: 'food_dining_restaurants',
        timestamps: true
    }
);

diningRestaurantSchema.index({ restaurantId: 1 }, { unique: true });
diningRestaurantSchema.index({ isEnabled: 1, primaryCategoryId: 1 });

export const FoodDiningRestaurant = mongoose.model('FoodDiningRestaurant', diningRestaurantSchema, 'food_dining_restaurants');
