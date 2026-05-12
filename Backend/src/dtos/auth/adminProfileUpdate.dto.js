import { z } from 'zod';
import { ValidationError } from '../../core/auth/errors.js';

const schema = z.object({
    name: z.string().max(200).optional(),
    email: z.string().trim().toLowerCase().email('Invalid email').max(200).optional(),
    phone: z.string().max(30).optional(),
    profileImage: z.string().max(2000).optional()
});

export const validateAdminProfileUpdateDto = (body) => {
    const result = schema.safeParse(body);
    if (!result.success) {
        const msg = result.error.errors[0]?.message || 'Invalid profile data';
        throw new ValidationError(msg);
    }
    return result.data;
};
