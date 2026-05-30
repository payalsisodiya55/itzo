import { FoodWishlist } from '../models/foodWishlist.model.js';
import { sendResponse } from '../../../../utils/response.js';

/**
 * Get user's food wishlist
 */
export const getWishlistController = async (req, res) => {
    try {
        const userId = req.user.userId;

        let wishlist = await FoodWishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = await FoodWishlist.create({ userId, dishes: [] });
        }

        return sendResponse(res, 200, 'Wishlist fetched successfully', {
            wishlist: wishlist.dishes,
        });
    } catch (error) {
        return sendResponse(res, 500, 'Failed to fetch wishlist', null, error.message);
    }
};

/**
 * Toggle a dish in the food wishlist
 */
export const toggleWishlistController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { restaurantId, restaurantName, restaurantSlug, dishName, price } = req.body;

        if (!restaurantId || !dishName) {
            return sendResponse(res, 400, 'Restaurant ID and Dish Name are required');
        }

        let wishlist = await FoodWishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new FoodWishlist({ userId, dishes: [] });
        }

        // Check if dish already exists in wishlist
        const existingDishIndex = wishlist.dishes.findIndex(
            (d) => d.restaurantId.toString() === restaurantId.toString() && d.dishName === dishName
        );

        let isAdded = false;

        if (existingDishIndex > -1) {
            // Remove from wishlist
            wishlist.dishes.splice(existingDishIndex, 1);
            isAdded = false;
        } else {
            // Add to wishlist
            wishlist.dishes.push({
                restaurantId,
                restaurantName: restaurantName || 'Restaurant',
                restaurantSlug: restaurantSlug || 'restaurant',
                dishName,
                price: price || 0,
                savedAt: new Date()
            });
            isAdded = true;
        }

        await wishlist.save();

        return sendResponse(res, 200, isAdded ? 'Dish added to wishlist' : 'Dish removed from wishlist', {
            isAdded,
            wishlist: wishlist.dishes,
        });
    } catch (error) {
        return sendResponse(res, 500, 'Failed to toggle wishlist', null, error.message);
    }
};
