import { sendResponse } from '../../../../utils/response.js';
import {
    getRestaurantMenu,
    updateRestaurantMenu,
    getPublicApprovedRestaurantMenu
} from '../services/restaurantMenu.service.js';

export const getMenuController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const menu = await getRestaurantMenu(restaurantId);
        return sendResponse(res, 200, 'Menu fetched successfully', { menu });
    } catch (error) {
        next(error);
    }
};

export const updateMenuController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const menu = await updateRestaurantMenu(restaurantId, req.body || {});
        return sendResponse(res, 200, 'Menu updated successfully', { menu });
    } catch (error) {
        next(error);
    }
};

export const getPublicRestaurantMenuController = async (req, res, next) => {
    try {
        const menu = await getPublicApprovedRestaurantMenu(req.params.id);
        if (!menu) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        return sendResponse(res, 200, 'Menu fetched successfully', { menu });
    } catch (error) {
        next(error);
    }
};

