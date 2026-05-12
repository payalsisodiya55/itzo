import { FoodZone } from '../../admin/models/zone.model.js';

const toFinite = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
};

// Ray-casting point-in-polygon for lat/lng polygons.
const isPointInPolygon = (lat, lng, polygon) => {
    if (!Array.isArray(polygon) || polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].longitude;
        const yi = polygon[i].latitude;
        const xj = polygon[j].longitude;
        const yj = polygon[j].latitude;
        const intersect =
            yi > lat !== yj > lat &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
};

/** GET /zones/detect?lat=..&lng=.. */
export const detectZonePublicController = async (req, res, next) => {
    try {
        const lat = toFinite(req.query.lat);
        const lng = toFinite(req.query.lng);
        if (lat === null || lng === null) {
            return res.status(400).json({ success: false, message: 'lat and lng are required' });
        }

        const zones = await FoodZone.find({ isActive: true }).lean();
        for (const zone of zones) {
            const coords = Array.isArray(zone.coordinates) ? zone.coordinates : [];
            if (coords.length < 3) continue;
            if (isPointInPolygon(lat, lng, coords)) {
                return res.status(200).json({
                    success: true,
                    message: 'Zone detected',
                    data: { status: 'IN_SERVICE', zoneId: zone._id, zone }
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Out of service',
            data: { status: 'OUT_OF_SERVICE', zoneId: null, zone: null }
        });
    } catch (error) {
        next(error);
    }
};

/** GET /zones/public - list active zones for onboarding/selects */
export const listZonesPublicController = async (_req, res, next) => {
    try {
        const zones = await FoodZone.find({ isActive: true })
            .select('name zoneName serviceLocation country unit isActive coordinates createdAt')
            .sort({ createdAt: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            message: 'Zones fetched successfully',
            data: { zones }
        });
    } catch (error) {
        next(error);
    }
};

/** GET /zones/nearby - list zones for hotspot/nearby visualization */
export const listZonesNearbyPublicController = async (req, res, next) => {
    try {
        const zones = await FoodZone.find({ isActive: true })
            .select('name zoneName serviceLocation country unit isActive coordinates createdAt')
            .sort({ createdAt: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            message: 'Nearby zones fetched',
            data: { zones }
        });
    } catch (error) {
        next(error);
    }
};

