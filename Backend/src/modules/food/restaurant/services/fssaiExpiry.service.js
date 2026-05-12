import { FoodRestaurant } from '../models/restaurant.model.js';
import { FoodNotification } from '../../../../core/notifications/models/notification.model.js';
import { notifyOwnerSafely, notifyAdminsSafely } from '../../../../core/notifications/firebase.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateLabel = (value) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const startOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const nextDay = (date) => new Date(date.getTime() + DAY_MS);

const buildRestaurantNotificationPayload = (restaurant) => {
    const expiryDate = restaurant?.fssaiExpiry ? new Date(restaurant.fssaiExpiry) : null;
    const restaurantName = restaurant?.restaurantName || 'Restaurant';
    const ownerName = restaurant?.ownerName || 'Restaurant owner';
    const expiryLabel = toDateLabel(expiryDate);
    const title = 'FSSAI License Expired';
    const message = `${restaurantName} FSSAI license expired on ${expiryLabel}. Owner: ${ownerName}. FSSAI No: ${restaurant?.fssaiNumber || 'N/A'}.`;

    return {
        title,
        message,
        link: '/restaurant/fssai',
        category: 'compliance',
        source: 'FSSAI_EXPIRY',
        metadata: {
            restaurantId: String(restaurant?._id || ''),
            restaurantName,
            ownerName,
            ownerPhone: restaurant?.ownerPhone || '',
            fssaiNumber: restaurant?.fssaiNumber || '',
            expiryDate: expiryDate ? expiryDate.toISOString() : null
        }
    };
};

const buildAdminSummary = (restaurant) => {
    const expiryDate = restaurant?.fssaiExpiry ? new Date(restaurant.fssaiExpiry) : null;
    const expiryLabel = toDateLabel(expiryDate);
    return {
        id: `fssai-expired-${String(restaurant?._id || '')}`,
        restaurantId: String(restaurant?._id || ''),
        restaurantName: restaurant?.restaurantName || 'Restaurant',
        ownerName: restaurant?.ownerName || '',
        ownerPhone: restaurant?.ownerPhone || '',
        fssaiNumber: restaurant?.fssaiNumber || '',
        fssaiExpiry: expiryDate ? expiryDate.toISOString() : null,
        expiryLabel,
        title: 'FSSAI License Expired',
        message: `${restaurant?.restaurantName || 'Restaurant'} FSSAI expired on ${expiryLabel}. Owner: ${restaurant?.ownerName || 'N/A'}.`,
        createdAt: expiryDate ? expiryDate.toISOString() : restaurant?.updatedAt || restaurant?.createdAt || new Date().toISOString(),
        path: '/admin/food/restaurants'
    };
};

export const listExpiredFssaiRestaurants = async () => {
    const today = startOfToday();

    const restaurants = await FoodRestaurant.find({
        status: 'approved',
        fssaiExpiry: { $lt: nextDay(today) }
    })
        .select('restaurantName ownerName ownerPhone fssaiNumber fssaiExpiry')
        .sort({ fssaiExpiry: -1, updatedAt: -1 })
        .lean();

    return restaurants
        .filter((restaurant) => restaurant?.fssaiExpiry)
        .map(buildAdminSummary);
};

export const syncExpiredFssaiNotifications = async () => {
    const restaurants = await listExpiredFssaiRestaurants();
    let createdCount = 0;

    for (const summary of restaurants) {
        const expiryIso = summary.fssaiExpiry;
        const restaurantId = summary.restaurantId;
        if (!restaurantId || !expiryIso) continue;

        const payload = buildRestaurantNotificationPayload({
            _id: restaurantId,
            restaurantName: summary.restaurantName,
            ownerName: summary.ownerName,
            ownerPhone: summary.ownerPhone,
            fssaiNumber: summary.fssaiNumber,
            fssaiExpiry: expiryIso
        });

        const existing = await FoodNotification.findOne({
            ownerType: 'RESTAURANT',
            ownerId: restaurantId,
            source: 'FSSAI_EXPIRY',
            'metadata.expiryDate': expiryIso
        })
            .select('_id')
            .lean();

        if (existing) continue;

        await FoodNotification.create({
            ownerType: 'RESTAURANT',
            ownerId: restaurantId,
            title: payload.title,
            message: payload.message,
            link: payload.link,
            category: payload.category,
            source: payload.source,
            metadata: payload.metadata
        });

        await notifyOwnerSafely(
            { ownerType: 'RESTAURANT', ownerId: restaurantId },
            {
                title: payload.title,
                body: payload.message,
                data: {
                    type: 'fssai_expired',
                    restaurantId,
                    expiryDate: expiryIso,
                    fssaiNumber: summary.fssaiNumber || ''
                }
            }
        );

        await notifyAdminsSafely({
            title: 'Restaurant FSSAI Expired',
            body: `${summary.restaurantName} FSSAI expired on ${summary.expiryLabel}. Owner: ${summary.ownerName || 'N/A'}.`,
            data: {
                type: 'restaurant_fssai_expired',
                restaurantId,
                expiryDate: expiryIso,
                fssaiNumber: summary.fssaiNumber || ''
            }
        });

        createdCount += 1;
    }

    return {
        totalExpired: restaurants.length,
        createdCount
    };
};
