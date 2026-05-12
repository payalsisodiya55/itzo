import mongoose from 'mongoose';
import { ValidationError } from '../../../../core/auth/errors.js';
import { createInboxNotifications } from '../../../../core/notifications/notification.service.js';
import { getIO, rooms } from '../../../../config/socket.js';
import { FoodRestaurant } from '../../restaurant/models/restaurant.model.js';
import { FoodDiningCategory } from '../models/diningCategory.model.js';
import { FoodDiningRestaurant } from '../models/diningRestaurant.model.js';
import { FoodZone } from '../../admin/models/zone.model.js';

const slugify = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const toObjectIdArray = (values) =>
    Array.from(
        new Set(
            (Array.isArray(values) ? values : [values])
                .map((value) => String(value || '').trim())
                .filter((value) => mongoose.Types.ObjectId.isValid(value))
        )
    ).map((value) => new mongoose.Types.ObjectId(value));

const parseBoolean = (value, fallback = false) => {
    if (value === undefined || value === null) return Boolean(fallback);
    if (typeof value === 'boolean') return value;
    const normalized = String(value).trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    return Boolean(fallback);
};

const toValidPrimaryCategoryId = (value, validCategoryIds = []) => {
    const nextPrimaryCategoryId = mongoose.Types.ObjectId.isValid(value)
        ? new mongoose.Types.ObjectId(String(value))
        : null;

    const isAllowed = nextPrimaryCategoryId
        && validCategoryIds.some((categoryId) => String(categoryId) === String(nextPrimaryCategoryId));

    return isAllowed ? nextPrimaryCategoryId : (validCategoryIds[0] || null);
};

const areObjectIdArraysEqual = (left = [], right = []) => {
    if (left.length !== right.length) return false;
    const leftIds = left.map((item) => String(item)).sort();
    const rightIds = right.map((item) => String(item)).sort();
    return leftIds.every((item, index) => item === rightIds[index]);
};

const emitDiningRealtimeAlert = (ownerType, ownerId, payload = {}) => {
    const io = getIO();
    if (!io || !ownerId) return;

    if (ownerType === 'ADMIN') {
        io.to(rooms.admin(ownerId)).emit('admin_notification', payload);
        return;
    }

    if (ownerType === 'RESTAURANT') {
        io.to(rooms.restaurant(ownerId)).emit('restaurant_notification', payload);
    }
};

async function notifyRestaurantDiningRequestSubmitted(restaurant, pendingRequest, categories = []) {
    const categoryLabel = categories.map((item) => item?.name).filter(Boolean).join(', ') || 'Dining';

    await createInboxNotifications({
        notifications: [
            {
                ownerType: 'RESTAURANT',
                ownerId: restaurant._id,
                title: 'Dining request submitted',
                message: `Your dining update request for ${categoryLabel} was sent to admin for approval.`,
                category: 'dining_request',
                link: '/food/restaurant/reservations',
                metadata: {
                    type: 'dining_request_submitted',
                    requestedAt: pendingRequest?.requestedAt || new Date().toISOString()
                }
            }
        ]
    });
}

async function notifyRestaurantDiningRequestResolved(restaurant, decision, categories = []) {
    const isApproved = decision === 'approved';
    const categoryLabel = categories.map((item) => item?.name).filter(Boolean).join(', ') || 'Dining';

    await createInboxNotifications({
        notifications: [
            {
                ownerType: 'RESTAURANT',
                ownerId: restaurant._id,
                title: isApproved ? 'Dining request approved' : 'Dining request rejected',
                message: isApproved
                    ? `Admin approved your dining request for ${categoryLabel}.`
                    : `Admin rejected your dining request for ${categoryLabel}. Please review and submit again.`,
                category: 'dining_request',
                link: '/food/restaurant/reservations',
                metadata: {
                    type: isApproved ? 'dining_request_approved' : 'dining_request_rejected'
                }
            }
        ]
    });

    emitDiningRealtimeAlert('RESTAURANT', restaurant._id, {
        type: isApproved ? 'dining_request_approved' : 'dining_request_rejected',
        restaurantId: String(restaurant._id)
    });
}

async function notifyAdminsForDiningRequest(restaurant, categories = []) {
    const categoryLabel = categories.map((item) => item?.name).filter(Boolean).join(', ') || 'Dining';

    try {
        const { FoodAdmin } = await import('../../../../core/admin/admin.model.js');
        const { notifyAdminsSafely } = await import('../../../../core/notifications/firebase.service.js');

        void notifyAdminsSafely({
            title: 'Dining approval request',
            body: `${restaurant.restaurantName || 'Restaurant'} submitted a dining update request.`,
            data: {
                type: 'dining_request',
                restaurantId: String(restaurant._id)
            }
        });

        const admins = await FoodAdmin.find({ isActive: true }).select('_id').lean();
        admins.forEach((admin) => {
            emitDiningRealtimeAlert('ADMIN', admin?._id, {
                type: 'dining_request',
                restaurantId: String(restaurant._id),
                restaurantName: restaurant.restaurantName || '',
                categories: categoryLabel
            });
        });
    } catch (error) {
        // Notification failures should not block the approval flow.
    }
}

async function syncRestaurantDiningSettings(restaurantId, diningDoc) {
    const primaryCategory = diningDoc?.primaryCategoryId
        ? await FoodDiningCategory.findById(diningDoc.primaryCategoryId).select('slug').lean()
        : null;
    const isEnabled = Boolean(diningDoc?.isEnabled);
    const maxGuests = Math.max(0, Number(diningDoc?.maxGuests) || 0);

    await FoodRestaurant.findByIdAndUpdate(
        restaurantId,
        {
            $set: {
                diningSettings: {
                    isEnabled,
                    maxGuests: isEnabled ? Math.max(1, maxGuests || 6) : 0,
                    diningType: isEnabled ? (primaryCategory?.slug || 'family-dining') : ''
                }
            }
        },
        { new: false }
    );
}

async function syncCategoryRestaurantLinks(restaurantId, categoryIds) {
    await FoodDiningCategory.updateMany(
        { restaurantIds: restaurantId, _id: { $nin: categoryIds } },
        { $pull: { restaurantIds: restaurantId } }
    );

    if (categoryIds.length > 0) {
        await FoodDiningCategory.updateMany(
            { _id: { $in: categoryIds } },
            { $addToSet: { restaurantIds: restaurantId } }
        );
    }
}

function mapCategory(doc) {
    return {
        _id: doc._id,
        name: doc.name,
        slug: doc.slug,
        imageUrl: doc.imageUrl || '',
        isActive: doc.isActive !== false,
        sortOrder: doc.sortOrder || 0,
        restaurantCount: Array.isArray(doc.restaurantIds) ? doc.restaurantIds.length : 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
    };
}

function getRestaurantZone(restaurant) {
    return (
        restaurant?.location?.area ||
        restaurant?.location?.city ||
        restaurant?.area ||
        restaurant?.city ||
        'N/A'
    );
}

function zoneToPolygon(zoneDoc) {
    const coords = Array.isArray(zoneDoc?.coordinates) ? zoneDoc.coordinates : [];
    if (coords.length < 3) return null;

    const ring = coords
        .map((coord) => [Number(coord.longitude), Number(coord.latitude)])
        .filter((pair) => pair.every((value) => Number.isFinite(value)));

    if (ring.length < 3) return null;

    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push(first);
    }

    return { type: 'Polygon', coordinates: [ring] };
}

async function buildRestaurantZoneMatch(zoneIdRaw) {
    const trimmedZoneId = String(zoneIdRaw || '').trim();
    if (!trimmedZoneId || !mongoose.Types.ObjectId.isValid(trimmedZoneId)) {
        return null;
    }

    const zoneClauses = [{ zoneId: new mongoose.Types.ObjectId(trimmedZoneId) }];
    const zoneDoc = await FoodZone.findOne({ _id: trimmedZoneId, isActive: true }).lean();
    const polygon = zoneToPolygon(zoneDoc);
    if (polygon) {
        zoneClauses.push({ location: { $geoWithin: { $geometry: polygon } } });
    }

    return { $or: zoneClauses };
}

function getRestaurantImage(restaurant) {
    const profileValue = restaurant?.profileImage;
    const profileUrl = profileValue && (typeof profileValue === 'string' ? profileValue : profileValue.url || profileValue.secure_url);
    if (profileUrl) return profileUrl;

    const coverImage = Array.isArray(restaurant?.coverImages)
        ? restaurant.coverImages
            .map((image) => (typeof image === 'string' ? image : image?.url || image?.secure_url || ''))
            .find(Boolean)
        : '';
    if (coverImage) return coverImage;

    const menuImage = Array.isArray(restaurant?.menuImages)
        ? restaurant.menuImages
            .map((image) => (typeof image === 'string' ? image : image?.url || image?.secure_url || ''))
            .find(Boolean)
        : '';
    if (menuImage) return menuImage;

    return '';
}

function mapDiningRestaurant(restaurant, diningDoc, categoriesById) {
    const categoryIds = (diningDoc?.categoryIds || []).map((id) => String(id));
    const categories = categoryIds
        .map((id) => categoriesById.get(id))
        .filter(Boolean)
        .map((category) => ({
            _id: category._id,
            name: category.name,
            slug: category.slug,
            imageUrl: category.imageUrl || ''
        }));

    const primaryCategoryId = diningDoc?.primaryCategoryId ? String(diningDoc.primaryCategoryId) : '';
    const primaryCategory = categories.find((category) => String(category._id) === primaryCategoryId) || categories[0] || null;
    const pendingCategoryIds = (diningDoc?.pendingRequest?.categoryIds || []).map((id) => String(id));
    const pendingCategories = pendingCategoryIds
        .map((id) => categoriesById.get(id))
        .filter(Boolean)
        .map((category) => ({
            _id: category._id,
            name: category.name,
            slug: category.slug,
            imageUrl: category.imageUrl || ''
        }));
    const pendingPrimaryCategoryId = diningDoc?.pendingRequest?.primaryCategoryId
        ? String(diningDoc.pendingRequest.primaryCategoryId)
        : '';
    const pendingPrimaryCategory =
        pendingCategories.find((category) => String(category._id) === pendingPrimaryCategoryId)
        || pendingCategories[0]
        || null;

    return {
        _id: restaurant._id,
        id: restaurant._id,
        name: restaurant.restaurantName || restaurant.name || 'N/A',
        restaurantName: restaurant.restaurantName || restaurant.name || 'N/A',
        ownerName: restaurant.ownerName || 'N/A',
        ownerPhone: restaurant.ownerPhone || restaurant.phone || 'N/A',
        pureVegRestaurant: diningDoc?.pureVegRestaurant === true || restaurant?.pureVegRestaurant === true,
        zone: getRestaurantZone(restaurant),
        city: restaurant?.location?.city || restaurant?.city || '',
        status: restaurant.status,
        isActive: restaurant.status === 'approved',
        rating: Number(restaurant.rating || 0),
        logo: getRestaurantImage(restaurant),
        categories,
        categoryIds,
        primaryCategoryId: primaryCategory?._id || null,
        diningSettings: {
            isEnabled: Boolean(diningDoc?.isEnabled),
            maxGuests: diningDoc?.isEnabled ? Math.max(1, Number(diningDoc?.maxGuests) || 6) : 0,
            pureVegRestaurant: diningDoc?.pureVegRestaurant === true || restaurant?.pureVegRestaurant === true,
            diningType: primaryCategory?.slug || restaurant?.diningSettings?.diningType || ''
        },
        pendingDiningRequest: diningDoc?.pendingRequest?.requestedAt
            ? {
                isEnabled: Boolean(diningDoc?.pendingRequest?.isEnabled),
                maxGuests: diningDoc?.pendingRequest?.isEnabled ? Math.max(1, Number(diningDoc?.pendingRequest?.maxGuests) || 6) : 0,
                requestedAt: diningDoc?.pendingRequest?.requestedAt,
                note: diningDoc?.pendingRequest?.note || '',
                categories: pendingCategories,
                categoryIds: pendingCategoryIds,
                primaryCategoryId: pendingPrimaryCategory?._id || null,
                diningType: pendingPrimaryCategory?.slug || primaryCategory?.slug || restaurant?.diningSettings?.diningType || ''
            }
            : null
    };
}

export async function getRestaurantDiningSnapshot(restaurantId) {
    if (!mongoose.Types.ObjectId.isValid(String(restaurantId || ''))) {
        return {
            categoryIds: [],
            categories: [],
            primaryCategoryId: null,
            pendingDiningRequest: null
        };
    }

    const diningDoc = await FoodDiningRestaurant.findOne({ restaurantId })
        .select('categoryIds primaryCategoryId pendingRequest isEnabled maxGuests pureVegRestaurant')
        .lean();

    if (!diningDoc) {
        return {
            categoryIds: [],
            categories: [],
            primaryCategoryId: null,
            pendingDiningRequest: null
        };
    }

    const categoryIds = [
        ...(diningDoc.categoryIds || []),
        ...(diningDoc.pendingRequest?.categoryIds || [])
    ].map((id) => new mongoose.Types.ObjectId(String(id)));

    const categories = categoryIds.length > 0
        ? await FoodDiningCategory.find({ _id: { $in: categoryIds } }).select('name slug imageUrl').lean()
        : [];
    const categoriesById = new Map(categories.map((category) => [String(category._id), category]));

    const approvedCategoryIds = (diningDoc.categoryIds || []).map((id) => String(id));
    const approvedCategories = approvedCategoryIds
        .map((id) => categoriesById.get(id))
        .filter(Boolean)
        .map((category) => ({
            _id: category._id,
            name: category.name,
            slug: category.slug,
            imageUrl: category.imageUrl || ''
        }));

    const pendingCategoryIds = (diningDoc.pendingRequest?.categoryIds || []).map((id) => String(id));
    const pendingCategories = pendingCategoryIds
        .map((id) => categoriesById.get(id))
        .filter(Boolean)
        .map((category) => ({
            _id: category._id,
            name: category.name,
            slug: category.slug,
            imageUrl: category.imageUrl || ''
        }));

    const pendingPrimaryCategoryId = diningDoc.pendingRequest?.primaryCategoryId
        ? String(diningDoc.pendingRequest.primaryCategoryId)
        : '';
    const pendingPrimaryCategory =
        pendingCategories.find((category) => String(category._id) === pendingPrimaryCategoryId)
        || pendingCategories[0]
        || null;

    return {
        categoryIds: approvedCategoryIds,
        categories: approvedCategories,
        primaryCategoryId: diningDoc.primaryCategoryId || approvedCategories[0]?._id || null,
        pendingDiningRequest: diningDoc.pendingRequest?.requestedAt
            ? {
                isEnabled: Boolean(diningDoc.pendingRequest.isEnabled),
                maxGuests: diningDoc.pendingRequest.isEnabled ? Math.max(1, Number(diningDoc.pendingRequest.maxGuests) || 6) : 0,
                requestedAt: diningDoc.pendingRequest.requestedAt,
                note: diningDoc.pendingRequest.note || '',
                categoryIds: pendingCategoryIds,
                categories: pendingCategories,
                primaryCategoryId: pendingPrimaryCategory?._id || null,
                diningType: pendingPrimaryCategory?.slug || ''
            }
            : null
    };
}

export async function submitRestaurantDiningRequest(restaurantId, body = {}) {
    if (!mongoose.Types.ObjectId.isValid(String(restaurantId || ''))) {
        throw new ValidationError('Invalid restaurant id');
    }

    const restaurant = await FoodRestaurant.findById(restaurantId)
        .select('restaurantName pureVegRestaurant diningSettings')
        .lean();

    if (!restaurant) {
        throw new ValidationError('Restaurant not found');
    }

    let diningDoc = await FoodDiningRestaurant.findOne({ restaurantId });
    if (!diningDoc) {
        diningDoc = new FoodDiningRestaurant({
            restaurantId,
            isEnabled: restaurant?.diningSettings?.isEnabled === true,
            maxGuests: Math.max(1, Number(restaurant?.diningSettings?.maxGuests) || 6),
            pureVegRestaurant: restaurant.pureVegRestaurant === true
        });
    }

    const requestedCategoryIds = body.categoryIds !== undefined
        ? toObjectIdArray(body.categoryIds)
        : (diningDoc.pendingRequest?.categoryIds || diningDoc.categoryIds || []);
    const nextIsEnabled = parseBoolean(body.isEnabled, diningDoc.isEnabled);

    const validCategories = nextIsEnabled && requestedCategoryIds.length > 0
        ? await FoodDiningCategory.find({ _id: { $in: requestedCategoryIds } }).select('name slug imageUrl').lean()
        : [];
    const validCategoryIds = validCategories.map((category) => category._id);
    const primaryCategoryId = toValidPrimaryCategoryId(
        body.primaryCategoryId !== undefined ? body.primaryCategoryId : diningDoc.pendingRequest?.primaryCategoryId,
        validCategoryIds
    );

    if (nextIsEnabled && validCategoryIds.length === 0) {
        throw new ValidationError('Select at least one dining category');
    }

    const nextRequest = {
        isEnabled: nextIsEnabled,
        maxGuests: nextIsEnabled
            ? Math.max(1, parseInt(body.maxGuests ?? diningDoc.maxGuests ?? 6, 10) || 6)
            : 0,
        categoryIds: nextIsEnabled ? validCategoryIds : [],
        primaryCategoryId: nextIsEnabled ? primaryCategoryId : null,
        requestedAt: new Date(),
        note: String(body.note || '').trim()
    };

    const matchesApprovedSettings =
        nextRequest.isEnabled === Boolean(diningDoc.isEnabled)
        && nextRequest.maxGuests === Math.max(1, Number(diningDoc.maxGuests) || 6)
        && areObjectIdArraysEqual(nextRequest.categoryIds, diningDoc.categoryIds || [])
        && String(nextRequest.primaryCategoryId || '') === String(diningDoc.primaryCategoryId || '');

    if (matchesApprovedSettings) {
        throw new ValidationError('No dining changes found to submit for approval');
    }

    diningDoc.pendingRequest = nextRequest;
    if (typeof diningDoc.pureVegRestaurant !== 'boolean') {
        diningDoc.pureVegRestaurant = restaurant.pureVegRestaurant === true;
    }
    await diningDoc.save();

    await Promise.all([
        notifyRestaurantDiningRequestSubmitted(restaurant, nextRequest, validCategories),
        notifyAdminsForDiningRequest(restaurant, validCategories)
    ]);

    return {
        status: 'pending',
        requestedAt: nextRequest.requestedAt
    };
}

export async function listDiningCategoriesAdmin() {
    const categories = await FoodDiningCategory.find({})
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();
    return { categories: categories.map(mapCategory) };
}

export async function createDiningCategory(body = {}) {
    const name = String(body.name || '').trim();
    if (!name) {
        throw new ValidationError('Category name is required');
    }

    const slug = slugify(body.slug || name);
    if (!slug) {
        throw new ValidationError('Category slug is required');
    }

    const existing = await FoodDiningCategory.findOne({ slug }).lean();
    if (existing) {
        throw new ValidationError('Dining category already exists');
    }

    const created = await FoodDiningCategory.create({
        name,
        slug,
        imageUrl: String(body.imageUrl || '').trim(),
        isActive: body.isActive !== false,
        sortOrder: Number(body.sortOrder) || 0
    });

    return mapCategory(created.toObject());
}

export async function updateDiningCategory(id, body = {}) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const doc = await FoodDiningCategory.findById(id);
    if (!doc) return null;

    if (body.name !== undefined) {
        doc.name = String(body.name || '').trim();
    }
    if (body.slug !== undefined || body.name !== undefined) {
        const nextSlug = slugify(body.slug || doc.name);
        const conflict = await FoodDiningCategory.findOne({ slug: nextSlug, _id: { $ne: doc._id } }).lean();
        if (conflict) {
            throw new ValidationError('Dining category slug already exists');
        }
        doc.slug = nextSlug;
    }
    if (body.imageUrl !== undefined) {
        doc.imageUrl = String(body.imageUrl || '').trim();
    }
    if (body.isActive !== undefined) {
        doc.isActive = body.isActive !== false;
    }
    if (body.sortOrder !== undefined) {
        doc.sortOrder = Number(body.sortOrder) || 0;
    }

    await doc.save();

    const linkedDiningDocs = await FoodDiningRestaurant.find({ categoryIds: doc._id }).select('_id restaurantId').lean();
    await Promise.all(linkedDiningDocs.map(async (item) => {
        await syncRestaurantDiningSettings(item.restaurantId, await FoodDiningRestaurant.findById(item._id).lean());
    }));

    return mapCategory(doc.toObject());
}

export async function deleteDiningCategory(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const category = await FoodDiningCategory.findByIdAndDelete(id).lean();
    if (!category) return null;

    const categoryId = new mongoose.Types.ObjectId(id);
    const diningDocs = await FoodDiningRestaurant.find({ categoryIds: categoryId });

    for (const doc of diningDocs) {
        doc.categoryIds = (doc.categoryIds || []).filter((value) => String(value) !== id);
        if (doc.primaryCategoryId && String(doc.primaryCategoryId) === id) {
            doc.primaryCategoryId = doc.categoryIds[0] || null;
        }
        if (typeof doc.pureVegRestaurant !== 'boolean') {
            const sourceRestaurant = await FoodRestaurant.findById(doc.restaurantId).select('pureVegRestaurant').lean();
            doc.pureVegRestaurant = sourceRestaurant?.pureVegRestaurant === true;
        }
        await doc.save();
        await syncRestaurantDiningSettings(doc.restaurantId, doc);
    }

    return { id };
}

export async function listDiningRestaurantsAdmin() {
    const [restaurants, diningDocs, categories] = await Promise.all([
        FoodRestaurant.find({})
            .sort({ createdAt: -1 })
            .select('restaurantName ownerName ownerPhone profileImage coverImages menuImages location area city status rating pureVegRestaurant diningSettings')
            .lean(),
        FoodDiningRestaurant.find({})
            .select('restaurantId categoryIds primaryCategoryId isEnabled maxGuests pureVegRestaurant pendingRequest')
            .lean(),
        FoodDiningCategory.find({}).select('name slug imageUrl').lean()
    ]);

    const categoriesById = new Map(categories.map((category) => [String(category._id), category]));
    const diningByRestaurantId = new Map(diningDocs.map((doc) => [String(doc.restaurantId), doc]));

    const items = restaurants.map((restaurant) =>
        mapDiningRestaurant(restaurant, diningByRestaurantId.get(String(restaurant._id)), categoriesById)
    );

    return { restaurants: items };
}

export async function updateDiningRestaurant(restaurantId, body = {}) {
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) return null;

    const restaurant = await FoodRestaurant.findById(restaurantId).lean();
    if (!restaurant) return null;

    let diningDoc = await FoodDiningRestaurant.findOne({ restaurantId });
    if (!diningDoc) {
        diningDoc = new FoodDiningRestaurant({
            restaurantId,
            pureVegRestaurant: restaurant.pureVegRestaurant === true
        });
    }

    const categoryIds = body.categoryIds !== undefined
        ? toObjectIdArray(body.categoryIds)
        : (diningDoc.categoryIds || []);

    const validCategories = categoryIds.length > 0
        ? await FoodDiningCategory.find({ _id: { $in: categoryIds } }).select('_id').lean()
        : [];
    const validCategoryIds = validCategories.map((category) => category._id);

    if (body.approvalAction === 'approve') {
        if (!diningDoc.pendingRequest?.requestedAt) {
            throw new ValidationError('No pending dining request found');
        }

        const pendingCategoryIds = toObjectIdArray(diningDoc.pendingRequest.categoryIds || []);
        const pendingCategories = pendingCategoryIds.length > 0
            ? await FoodDiningCategory.find({ _id: { $in: pendingCategoryIds } }).select('name slug imageUrl').lean()
            : [];
        const validPendingCategoryIds = pendingCategories.map((category) => category._id);

        diningDoc.categoryIds = validPendingCategoryIds;
        diningDoc.primaryCategoryId = toValidPrimaryCategoryId(
            diningDoc.pendingRequest.primaryCategoryId,
            validPendingCategoryIds
        );
        diningDoc.isEnabled = diningDoc.pendingRequest.isEnabled === true;
        diningDoc.maxGuests = diningDoc.pendingRequest.isEnabled === true
            ? Math.max(1, parseInt(diningDoc.pendingRequest.maxGuests, 10) || 6)
            : 0;
        if (diningDoc.isEnabled !== true) {
            diningDoc.categoryIds = [];
            diningDoc.primaryCategoryId = null;
        }
        diningDoc.set('pendingRequest', null);

        await diningDoc.save();
        await syncCategoryRestaurantLinks(restaurant._id, diningDoc.isEnabled ? validPendingCategoryIds : []);
        await syncRestaurantDiningSettings(restaurant._id, diningDoc);
        await notifyRestaurantDiningRequestResolved(restaurant, 'approved', pendingCategories);
    } else if (body.approvalAction === 'reject') {
        if (!diningDoc.pendingRequest?.requestedAt) {
            throw new ValidationError('No pending dining request found');
        }

        const pendingCategoryIds = toObjectIdArray(diningDoc.pendingRequest.categoryIds || []);
        const pendingCategories = pendingCategoryIds.length > 0
            ? await FoodDiningCategory.find({ _id: { $in: pendingCategoryIds } }).select('name slug imageUrl').lean()
            : [];
        diningDoc.set('pendingRequest', null);
        await diningDoc.save();
        await notifyRestaurantDiningRequestResolved(restaurant, 'rejected', pendingCategories);
    } else {
        if (body.categoryIds !== undefined) {
            diningDoc.categoryIds = validCategoryIds;
        }
        if (body.isEnabled !== undefined) {
            diningDoc.isEnabled = body.isEnabled === true;
        }
        if (body.maxGuests !== undefined) {
            diningDoc.maxGuests = Math.max(1, parseInt(body.maxGuests, 10) || 6);
        }
        if (body.pureVegRestaurant !== undefined) {
            if (typeof body.pureVegRestaurant === 'boolean') {
                diningDoc.pureVegRestaurant = body.pureVegRestaurant;
            } else if (typeof body.pureVegRestaurant === 'string') {
                const normalized = body.pureVegRestaurant.trim().toLowerCase();
                if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
                    diningDoc.pureVegRestaurant = true;
                } else if (normalized === 'false' || normalized === '0' || normalized === 'no') {
                    diningDoc.pureVegRestaurant = false;
                }
            }
        }

        if (body.primaryCategoryId !== undefined) {
            diningDoc.primaryCategoryId = mongoose.Types.ObjectId.isValid(body.primaryCategoryId)
                ? new mongoose.Types.ObjectId(body.primaryCategoryId)
                : null;
        }

        const primaryCategoryIsAllowed = diningDoc.primaryCategoryId
            && validCategoryIds.some((categoryId) => String(categoryId) === String(diningDoc.primaryCategoryId));

        if (!primaryCategoryIsAllowed) {
            diningDoc.primaryCategoryId = validCategoryIds[0] || null;
        }
        if (typeof diningDoc.pureVegRestaurant !== 'boolean') {
            diningDoc.pureVegRestaurant = restaurant.pureVegRestaurant === true;
        }

        await diningDoc.save();
        await syncCategoryRestaurantLinks(restaurant._id, validCategoryIds);
        await syncRestaurantDiningSettings(restaurant._id, diningDoc);
    }

    const categories = await FoodDiningCategory.find({}).select('name slug imageUrl').lean();
    const categoriesById = new Map(categories.map((category) => [String(category._id), category]));

    return mapDiningRestaurant(restaurant, diningDoc.toObject(), categoriesById);
}

export async function listDiningCategoriesPublic() {
    const categories = await FoodDiningCategory.find({ isActive: true })
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();
    return categories.map(mapCategory);
}

export async function listDiningRestaurantsPublic(query = {}) {
    const filter = { isEnabled: true };
    const categoryValue = String(query.category || '').trim();
    const cityValue = String(query.city || '').trim();
    const zoneMatch = await buildRestaurantZoneMatch(query.zoneId);

    if (categoryValue) {
        const category = await FoodDiningCategory.findOne({
            $or: [
                mongoose.Types.ObjectId.isValid(categoryValue) ? { _id: categoryValue } : null,
                { slug: categoryValue.toLowerCase() }
            ].filter(Boolean)
        }).lean();
        if (!category) {
            return [];
        }
        filter.categoryIds = category._id;
    }

    const restaurantMatch = {
        ...(cityValue
            ? {
                $or: [
                    { city: { $regex: cityValue, $options: 'i' } },
                    { 'location.city': { $regex: cityValue, $options: 'i' } }
                ]
            }
            : {})
    };

    if (zoneMatch) {
        restaurantMatch.$and = [...(restaurantMatch.$and || []), zoneMatch];
    }

    const diningDocs = await FoodDiningRestaurant.find(filter)
        .populate({
            path: 'restaurantId',
            select: 'restaurantName restaurantNameNormalized ownerName ownerPhone profileImage coverImages menuImages cuisines location area city status rating diningSettings estimatedDeliveryTime estimatedDeliveryTimeMinutes featuredDish featuredPrice offer openingTime closingTime openDays isAcceptingOrders costForTwo',
            match: restaurantMatch
        })
        .populate('categoryIds', 'name slug imageUrl')
        .lean();

    return diningDocs
        .filter((doc) => doc.restaurantId)
        .map((doc) => ({
            ...doc.restaurantId,
            restaurant: doc.restaurantId,
            categories: doc.categoryIds || [],
            diningSettings: {
                isEnabled: true,
                maxGuests: Math.max(1, Number(doc.maxGuests) || 6),
                pureVegRestaurant: doc.pureVegRestaurant === true || doc.restaurantId?.pureVegRestaurant === true,
                diningType: doc.categoryIds?.[0]?.slug || doc.restaurantId?.diningSettings?.diningType || ''
            }
        }));
}
