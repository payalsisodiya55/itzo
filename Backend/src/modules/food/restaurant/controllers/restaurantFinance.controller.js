import { sendResponse, sendError } from '../../../../utils/response.js';
import { getRestaurantFinance } from '../services/restaurantFinance.service.js';

export const getRestaurantFinanceController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        if (!restaurantId) return sendError(res, 401, 'Restaurant authentication required');

        const data = await getRestaurantFinance(restaurantId, req.query || {});
        // `sendResponse` already uses `data` as the top-level payload key.
        return sendResponse(res, 200, 'Finance fetched successfully', data);
    } catch (error) {
        next(error);
    }
};

