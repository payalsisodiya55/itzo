import mongoose from 'mongoose';

const coordinateSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

const quickZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    zoneName: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'India',
      index: true,
    },
    serviceLocation: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      enum: ['kilometer', 'miles'],
      default: 'kilometer',
    },
    coordinates: {
      type: [coordinateSchema],
      required: true,
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length >= 3;
        },
        message: 'Zone must have at least 3 coordinates (polygon).',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    collection: 'quick_zone',
    timestamps: true,
  },
);

quickZoneSchema.index({ isActive: 1, name: 1 });
quickZoneSchema.index({ country: 1, name: 1 });

export const QuickZone = mongoose.models.quick_zone || mongoose.model('quick_zone', quickZoneSchema, 'quick_zones');
