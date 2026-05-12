import mongoose from 'mongoose';
import * as diningService from '../services/dining.service.js';

export async function getDiningCategories(req, res, next) {
    try {
        const data = await diningService.listDiningCategoriesAdmin();
        res.status(200).json({ success: true, message: 'Dining categories fetched successfully', data });
    } catch (error) {
        next(error);
    }
}

export async function createDiningCategory(req, res, next) {
    try {
        const category = await diningService.createDiningCategory(req.body || {});
        res.status(201).json({ success: true, message: 'Dining category created successfully', data: { category } });
    } catch (error) {
        next(error);
    }
}

export async function updateDiningCategory(req, res, next) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid dining category id' });
        }
        const category = await diningService.updateDiningCategory(id, req.body || {});
        if (!category) {
            return res.status(404).json({ success: false, message: 'Dining category not found' });
        }
        res.status(200).json({ success: true, message: 'Dining category updated successfully', data: { category } });
    } catch (error) {
        next(error);
    }
}

export async function deleteDiningCategory(req, res, next) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid dining category id' });
        }
        const result = await diningService.deleteDiningCategory(id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Dining category not found' });
        }
        res.status(200).json({ success: true, message: 'Dining category deleted successfully', data: result });
    } catch (error) {
        next(error);
    }
}

export async function getDiningRestaurants(req, res, next) {
    try {
        const data = await diningService.listDiningRestaurantsAdmin();
        res.status(200).json({ success: true, message: 'Dining restaurants fetched successfully', data });
    } catch (error) {
        next(error);
    }
}

export async function updateDiningRestaurant(req, res, next) {
    try {
        const { restaurantId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ success: false, message: 'Invalid restaurant id' });
        }
        const restaurant = await diningService.updateDiningRestaurant(restaurantId, req.body || {});
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        res.status(200).json({ success: true, message: 'Dining restaurant updated successfully', data: { restaurant } });
    } catch (error) {
        next(error);
    }
}
