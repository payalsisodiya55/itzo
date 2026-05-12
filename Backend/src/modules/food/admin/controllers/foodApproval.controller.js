import { sendResponse, sendError } from '../../../../utils/response.js';
import {
    listPendingFoodApprovals,
    approveFoodItem,
    rejectFoodItem
} from '../services/foodApproval.service.js';

export async function getPendingFoodApprovals(req, res, next) {
    try {
        const data = await listPendingFoodApprovals(req.query || {});
        return sendResponse(res, 200, 'Pending food approvals fetched successfully', data);
    } catch (error) {
        next(error);
    }
}

export async function approveFoodItemController(req, res, next) {
    try {
        const updated = await approveFoodItem(req.params.id);
        if (!updated) return sendError(res, 404, 'Food item not found or not pending');
        return sendResponse(res, 200, 'Food item approved successfully', { food: updated });
    } catch (error) {
        next(error);
    }
}

export async function rejectFoodItemController(req, res, next) {
    try {
        const updated = await rejectFoodItem(req.params.id, req.body?.reason);
        if (!updated) return sendError(res, 404, 'Food item not found or not pending');
        return sendResponse(res, 200, 'Food item rejected successfully', { food: updated });
    } catch (error) {
        next(error);
    }
}

