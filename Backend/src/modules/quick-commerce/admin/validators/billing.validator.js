import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

const toggleBoolSchema = z.object({
  status: z.boolean().optional(),
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
  status: z.boolean().optional(),
});

export const validateDeliveryCommissionRuleDto = (body) => {
  const normalized = {
    name: body?.name != null ? String(body.name) : '',
    minDistance: Number(body?.minDistance),
    maxDistance:
      body?.maxDistance === null ||
      body?.maxDistance === undefined ||
      body?.maxDistance === ''
        ? null
        : Number(body.maxDistance),
    commissionPerKm: Number(body?.commissionPerKm),
    basePayout: Number(body?.basePayout),
    status: body?.status,
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
    status: typeof result.data.status === 'boolean' ? result.data.status : undefined,
  };
};

const rangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  fee: z.number().min(0),
});

const feeSettingsUpsertSchema = z.object({
  deliveryFee: z.number().min(0).nullable().optional(),
  deliveryFeeRanges: z.array(rangeSchema).optional(),
  freeDeliveryThreshold: z.number().min(0).nullable().optional(),
  platformFee: z.number().min(0).nullable().optional(),
  gstRate: z.number().min(0).max(100).nullable().optional(),
  returnDeliveryCommission: z.number().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const validateFeeSettingsUpsertDto = (body) => {
  const normalized = {
    deliveryFee:
      body?.deliveryFee === null
        ? null
        : body?.deliveryFee !== undefined
          ? Number(body.deliveryFee)
          : undefined,
    deliveryFeeRanges: Array.isArray(body?.deliveryFeeRanges)
      ? body.deliveryFeeRanges.map((r) => ({
          min: Number(r?.min),
          max: Number(r?.max),
          fee: Number(r?.fee),
        }))
      : undefined,
    freeDeliveryThreshold:
      body?.freeDeliveryThreshold === null
        ? null
        : body?.freeDeliveryThreshold !== undefined
          ? Number(body.freeDeliveryThreshold)
          : undefined,
    platformFee:
      body?.platformFee === null
        ? null
        : body?.platformFee !== undefined
          ? Number(body.platformFee)
          : undefined,
    gstRate:
      body?.gstRate === null
        ? null
        : body?.gstRate !== undefined
          ? Number(body.gstRate)
          : undefined,
    returnDeliveryCommission:
      body?.returnDeliveryCommission === null
        ? null
        : body?.returnDeliveryCommission !== undefined
          ? Number(body.returnDeliveryCommission)
          : undefined,
    isActive: body?.isActive !== undefined ? Boolean(body.isActive) : undefined,
  };

  const result = feeSettingsUpsertSchema.safeParse(normalized);
  if (!result.success) {
    throw new ValidationError(result.error.errors[0].message);
  }

  const ranges = Array.isArray(result.data.deliveryFeeRanges)
    ? result.data.deliveryFeeRanges
    : undefined;
  if (ranges) {
    const sorted = [...ranges].sort((a, b) => a.min - b.min);
    for (const r of sorted) {
      if (r.min >= r.max) {
        throw new ValidationError('Each range must have min less than max');
      }
    }
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      if (cur.min < prev.max) {
        throw new ValidationError('Delivery fee ranges must not overlap');
      }
    }
    result.data.deliveryFeeRanges = sorted;
  }

  return result.data;
};
