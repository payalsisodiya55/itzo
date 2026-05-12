import { z } from 'zod';
import mongoose from 'mongoose';
import { ValidationError } from '../../../../core/auth/errors.js';

const addBonusSchema = z.object({
    deliveryPartnerId: z.string().min(1, 'deliveryPartnerId is required'),
    amount: z.number().positive('Amount must be greater than 0'),
    reference: z.string().optional().or(z.literal(''))
});

export const validateAddDeliveryBonusDto = (body) => {
    const normalized = {
        deliveryPartnerId: body?.deliveryPartnerId ? String(body.deliveryPartnerId) : '',
        amount: Number(body?.amount),
        reference: body?.reference != null ? String(body.reference) : ''
    };

    const result = addBonusSchema.safeParse(normalized);
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    if (!mongoose.Types.ObjectId.isValid(result.data.deliveryPartnerId)) {
        throw new ValidationError('Invalid deliveryPartnerId');
    }
    return {
        deliveryPartnerId: result.data.deliveryPartnerId,
        amount: result.data.amount,
        reference: result.data.reference ? result.data.reference.trim() : ''
    };
};

