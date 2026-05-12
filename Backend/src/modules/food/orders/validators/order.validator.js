import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

const orderItemSchema = z.object({
    itemId: z.string().min(1, 'Item id required'),
    name: z.string().min(1, 'Item name required'),
    type: z.enum(['food', 'quick']),
    sourceId: z.string().min(1, 'Source id required'),
    sourceName: z.string().optional(),
    variantId: z.string().optional(),
    variantName: z.string().optional(),
    variantPrice: z.number().min(0).optional(),
    price: z.number().min(0),
    quantity: z.number().int().min(1),
    isVeg: z.boolean().optional().default(true),
    image: z.string().optional(),
    notes: z.string().optional()
});

const addressSchema = z.object({
    label: z.enum(['Home', 'Office', 'Other']).optional(),
    name: z.string().optional(),
    fullName: z.string().optional(),
    street: z.string().min(1, 'Street required'),
    additionalDetails: z.string().optional(),
    city: z.string().min(1, 'City required'),
    state: z.string().min(1, 'State required'),
    zipCode: z.string().optional(),
    phone: z.string().optional(),
    location: z
        .object({
            type: z.literal('Point').optional(),
            coordinates: z.tuple([z.number(), z.number()]).optional()
        })
        .optional()
});

const pricingSchema = z.object({
    subtotal: z.number().min(0),
    tax: z.number().min(0).optional(),
    packagingFee: z.number().min(0).optional(),
    deliveryFee: z.number().min(0).optional(),
    platformFee: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    total: z.number().min(0),
    currency: z.string().optional()
});

export function validateCalculateOrderDto(body) {
    const schema = z.object({
        orderType: z.enum(['food', 'quick', 'mixed']).optional(),
        items: z.array(orderItemSchema).min(1, 'At least one item required'),
        address: addressSchema.optional(),
        restaurantId: z.string().optional(),
        deliveryAddressId: z.string().optional(),
        zoneId: z.string().optional(),
        couponCode: z.string().optional(),
        deliveryFleet: z.string().optional(),
        scheduledAt: z.string().optional()
    }).superRefine((data, ctx) => {
        const hasFoodItems = data.items.some((item) => item.type === 'food');
        const hasQuickItems = data.items.some((item) => item.type === 'quick');

        // Auto-correct orderType if it's missing or inconsistent
        let effectiveType = data.orderType;
        if (!effectiveType) {
            if (hasFoodItems && hasQuickItems) effectiveType = 'mixed';
            else if (hasQuickItems) effectiveType = 'quick';
            else effectiveType = 'food';
        }

        if (effectiveType === 'mixed' && (!hasFoodItems || !hasQuickItems)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['items'],
                message: 'Mixed orders must include both food and quick items'
            });
        }
        if (effectiveType === 'food' && hasQuickItems) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['items'],
                message: 'Food orders cannot include quick items. Use mixed order type.'
            });
        }
        if (effectiveType === 'quick' && hasFoodItems) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['items'],
                message: 'Quick orders cannot include food items. Use mixed order type.'
            });
        }
        if (effectiveType === 'food' && !data.restaurantId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['restaurantId'],
                message: 'Restaurant id required'
            });
        }
    });
    const result = schema.safeParse(body);
    if (!result.success) {
        const first = result.error.issues?.[0];
        const path = first?.path?.length ? first.path.join('.') : '';
        const msg = path ? `${path}: ${first?.message || 'Validation failed'}` : first?.message || 'Validation failed';
        throw new ValidationError(msg);
    }
    return result.data;
}

export function validateCreateOrderDto(body) {
    const schema = z.object({
        orderType: z.enum(['food', 'quick', 'mixed']).optional(),
        items: z.array(orderItemSchema).min(1, 'At least one item required'),
        address: addressSchema.optional(),
        restaurantId: z.string().optional(),
        restaurantName: z.string().optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        pricing: pricingSchema,
        deliveryFleet: z.string().optional(),
        note: z.string().optional(),
        sendCutlery: z.boolean().optional(),
        // 'razorpay_qr' means COD-style flow, but payment is collected via Razorpay QR at delivery.
        paymentMethod: z.enum(['cash', 'razorpay', 'razorpay_qr', 'card', 'wallet']),
        zoneId: z.string().nullable().optional(),
        scheduledAt: z.string().optional()
    }).superRefine((data, ctx) => {
        const hasFoodItems = data.items.some((item) => item.type === 'food');
        const hasQuickItems = data.items.some((item) => item.type === 'quick');

        // Auto-correct orderType if it's missing or inconsistent
        let effectiveType = data.orderType;
        if (!effectiveType) {
            if (hasFoodItems && hasQuickItems) effectiveType = 'mixed';
            else if (hasQuickItems) effectiveType = 'quick';
            else effectiveType = 'food';
        }

        if (effectiveType === 'mixed' && (!hasFoodItems || !hasQuickItems)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['items'],
                message: 'Mixed orders must include both food and quick items'
            });
        }
        if (effectiveType === 'food' && hasQuickItems) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['items'],
                message: 'Food orders cannot include quick items. Use mixed order type.'
            });
        }
        if (effectiveType === 'quick' && hasFoodItems) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['items'],
                message: 'Quick orders cannot include food items. Use mixed order type.'
            });
        }
        if (effectiveType === 'food' && !data.restaurantId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['restaurantId'],
                message: 'Restaurant id required'
            });
        }
        if ((effectiveType === 'food' || effectiveType === 'mixed' || effectiveType === 'quick') && !data.address) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['address'],
                message: 'Address is required'
            });
        }
    });
    const result = schema.safeParse(body);
    if (!result.success) {
        const msg = result.error.errors?.[0]?.message || 'Validation failed';
        throw new ValidationError(msg);
    }
    return result.data;
}

export function validateVerifyPaymentDto(body) {
    const schema = z.object({
        orderId: z.string().min(1, 'Order id required'),
        razorpayOrderId: z.string().min(1, 'Razorpay order id required'),
        razorpayPaymentId: z.string().min(1, 'Razorpay payment id required'),
        razorpaySignature: z.string().min(1, 'Razorpay signature required')
    });
    const result = schema.safeParse(body);
    if (!result.success) {
        const msg = result.error.errors?.[0]?.message || 'Validation failed';
        throw new ValidationError(msg);
    }
    return result.data;
}

export function validateCancelOrderDto(body) {
    const schema = z.object({
        reason: z.string().optional(),
        refundTo: z.enum(['wallet', 'gateway']).optional()
    });
    const result = schema.safeParse(body || {});
    if (!result.success) {
        throw new ValidationError(result.error.errors?.[0]?.message || 'Validation failed');
    }
    return result.data;
}

export function validateOrderStatusDto(body) {
    const schema = z.object({
        orderStatus: z.enum([
            'confirmed',
            'preparing',
            'ready_for_pickup',
            'picked_up',
            'delivered',
            'cancelled_by_restaurant'
        ])
    });
    const result = schema.safeParse(body);
    if (!result.success) {
        throw new ValidationError(result.error.errors?.[0]?.message || 'Validation failed');
    }
    return result.data;
}

export function validateAssignDeliveryDto(body) {
    const schema = z.object({
        deliveryPartnerId: z.string().min(1, 'Delivery partner id required')
    });
    const result = schema.safeParse(body);
    if (!result.success) {
        throw new ValidationError(result.error.errors?.[0]?.message || 'Validation failed');
    }
    return result.data;
}

export function validateDispatchSettingsDto(body) {
    const schema = z.object({
        dispatchMode: z.enum(['auto', 'manual'])
    });
    const result = schema.safeParse(body);
    if (!result.success) {
        throw new ValidationError(result.error.errors?.[0]?.message || 'Validation failed');
    }
    return result.data;
}

export function validateOrderRatingsDto(body) {
    const schema = z.object({
        restaurantRating: z.number().min(1).max(5),
        deliveryPartnerRating: z.number().min(1).max(5).optional(),
        restaurantComment: z.string().max(500).optional(),
        deliveryPartnerComment: z.string().max(500).optional()
    });
    const result = schema.safeParse(body || {});
    if (!result.success) {
        throw new ValidationError(result.error.errors?.[0]?.message || 'Validation failed');
    }
    return result.data;
}
