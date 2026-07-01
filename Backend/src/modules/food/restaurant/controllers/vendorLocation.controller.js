import { sendError, sendResponse } from '../../../../utils/response.js';
import mongoose from 'mongoose';
import { FoodZone } from '../../admin/models/zone.model.js';
import { isPointInPolygon } from '../../../../utils/geo.js';

export const updateLiveLocationController = async (req, res) => {
    try {
        const { latitude, longitude, locationSource } = req.body;

        if (!latitude || !longitude) {
            return sendError(res, 400, 'Latitude and longitude are required');
        }

        const Restaurant = mongoose.model('FoodRestaurant');
        const restaurant = await Restaurant.findById(req.user.id);

        if (!restaurant) {
            return sendError(res, 404, 'Restaurant not found');
        }

        if (restaurant.businessType !== 'Street Food Vendor') {
            return sendError(res, 403, 'Only Street Food Vendors can update live location');
        }

        // Zone validation
        if (restaurant.zoneId) {
            const zone = await FoodZone.findById(restaurant.zoneId);
            if (zone && zone.coordinates && zone.coordinates.length >= 3) {
                const isInside = isPointInPolygon(Number(latitude), Number(longitude), zone.coordinates);
                if (!isInside) {
                    return sendError(res, 403, 'You can only operate inside your assigned delivery zone.');
                }
            }
        }

        restaurant.currentLocation = {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
            latitude: Number(latitude),
            longitude: Number(longitude)
        };
        restaurant.lastLocationUpdate = new Date();
        restaurant.locationSource = locationSource === 'manual' ? 'manual' : 'gps';
        
        await restaurant.save();

        return sendResponse(res, 200, 'Location updated successfully', {
            currentLocation: restaurant.currentLocation,
            lastLocationUpdate: restaurant.lastLocationUpdate
        });

    } catch (error) {
        console.error('Update live location error:', error);
        return sendError(res, 500, 'Failed to update live location');
    }
};

export const toggleLiveTrackingController = async (req, res) => {
    try {
        const { enabled } = req.body;

        if (typeof enabled !== 'boolean') {
            return sendError(res, 400, 'enabled flag is required and must be a boolean');
        }

        const Restaurant = mongoose.model('FoodRestaurant');
        const restaurant = await Restaurant.findById(req.user.id);

        if (!restaurant) {
            return sendError(res, 404, 'Restaurant not found');
        }

        if (restaurant.businessType !== 'Street Food Vendor') {
            return sendError(res, 403, 'Only Street Food Vendors can toggle live tracking');
        }

        restaurant.liveTrackingEnabled = enabled;
        await restaurant.save();

        return sendResponse(res, 200, `Live tracking ${enabled ? 'enabled' : 'disabled'} successfully`, {
            liveTrackingEnabled: restaurant.liveTrackingEnabled
        });

    } catch (error) {
        console.error('Toggle live tracking error:', error);
        return sendError(res, 500, 'Failed to toggle live tracking');
    }
};
