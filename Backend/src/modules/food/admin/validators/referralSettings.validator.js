import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

const schema = z.object({
    user: z.object({
        referrerReward: z.number().min(0).optional(),
        refereeReward: z.number().min(0).optional(),
        limit: z.number().min(0).optional(),
    }).optional(),
    delivery: z.object({
        referrerReward: z.number().min(0).optional(),
        refereeReward: z.number().min(0).optional(),
        limit: z.number().min(0).optional(),
    }).optional(),
    isActive: z.boolean().optional()
});

export const validateReferralSettingsUpsertDto = (body) => {
    const normalized = {
        user: body?.user ? {
            referrerReward: body.user.referrerReward !== undefined ? Number(body.user.referrerReward) : undefined,
            refereeReward: body.user.refereeReward !== undefined ? Number(body.user.refereeReward) : undefined,
            limit: body.user.limit !== undefined ? Number(body.user.limit) : undefined,
        } : undefined,
        delivery: body?.delivery ? {
            referrerReward: body.delivery.referrerReward !== undefined ? Number(body.delivery.referrerReward) : undefined,
            refereeReward: body.delivery.refereeReward !== undefined ? Number(body.delivery.refereeReward) : undefined,
            limit: body.delivery.limit !== undefined ? Number(body.delivery.limit) : undefined,
        } : undefined,
        isActive: body?.isActive !== undefined ? Boolean(body.isActive) : undefined
    };

    const result = schema.safeParse(normalized);
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    return result.data;
};

