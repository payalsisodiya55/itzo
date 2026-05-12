import { z } from 'zod';
import mongoose from 'mongoose';
import { ValidationError } from '../../../../core/auth/errors.js';

const restaurantCommissionUpsertSchema = z.object({
    restaurantId: z.string().min(1, 'Restaurant is required'),
    defaultCommission: z.object({
        type: z.enum(['percentage', 'amount']).default('percentage'),
        value: z.number().min(0, 'Commission value must be 0 or greater')
    }),
    notes: z.string().optional().or(z.literal(''))
});

export const validateRestaurantCommissionUpsertDto = (body) => {
    const normalized = {
        restaurantId: body?.restaurantId ? String(body.restaurantId) : '',
        defaultCommission: {
            type: body?.defaultCommission?.type,
            value: Number(body?.defaultCommission?.value)
        },
        notes: body?.notes != null ? String(body.notes) : ''
    };

    const result = restaurantCommissionUpsertSchema.safeParse(normalized);
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    if (!mongoose.Types.ObjectId.isValid(result.data.restaurantId)) {
        throw new ValidationError('Invalid restaurantId');
    }
    if (result.data.defaultCommission.type === 'percentage' && (result.data.defaultCommission.value < 0 || result.data.defaultCommission.value > 100)) {
        throw new ValidationError('Percentage must be between 0-100');
    }
    return {
        restaurantId: result.data.restaurantId,
        defaultCommission: result.data.defaultCommission,
        notes: result.data.notes ? result.data.notes.trim() : ''
    };
};

const toggleBoolSchema = z.object({
    status: z.boolean().optional()
});

export const validateOptionalStatusDto = (body) => {
    const result = toggleBoolSchema.safeParse(body || {});
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    return result.data;
};

const deliveryRuleSchema = z.object({
    name: z.string().optional().or(z.literal('')),
    minDistance: z.number().min(0, 'Minimum distance must be 0 or greater'),
    maxDistance: z.number().nullable().optional(),
    commissionPerKm: z.number().min(0, 'Commission per km must be 0 or greater'),
    basePayout: z.number().min(0, 'Base payout must be 0 or greater'),
    status: z.boolean().optional()
});

export const validateDeliveryCommissionRuleDto = (body) => {
    const normalized = {
        name: body?.name != null ? String(body.name) : '',
        minDistance: Number(body?.minDistance),
        maxDistance: body?.maxDistance === null || body?.maxDistance === undefined || body?.maxDistance === '' ? null : Number(body.maxDistance),
        commissionPerKm: Number(body?.commissionPerKm),
        basePayout: Number(body?.basePayout),
        status: body?.status
    };
    const result = deliveryRuleSchema.safeParse(normalized);
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    const min = result.data.minDistance;
    const base = result.data.basePayout;
    if (min !== 0 && base > 0) {
        throw new ValidationError('Only base slab can have base payout');
    }
    return {
        name: result.data.name ? result.data.name.trim() : '',
        minDistance: result.data.minDistance,
        maxDistance: result.data.maxDistance ?? null,
        commissionPerKm: result.data.commissionPerKm,
        basePayout: result.data.basePayout,
        status: typeof result.data.status === 'boolean' ? result.data.status : undefined
    };
};
