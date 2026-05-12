import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        ownerType: {
            type: String,
            enum: ['USER', 'RESTAURANT', 'DELIVERY_PARTNER'],
            required: true,
            index: true
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        link: {
            type: String,
            default: '',
            trim: true
        },
        category: {
            type: String,
            default: 'broadcast',
            trim: true
        },
        source: {
            type: String,
            enum: ['ADMIN_BROADCAST', 'FSSAI_EXPIRY'],
            default: 'ADMIN_BROADCAST',
            index: true
        },
        broadcastId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BroadcastNotification',
            default: undefined,
            index: true
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: {
            type: Date,
            default: null
        },
        dismissedAt: {
            type: Date,
            default: null,
            index: true
        }
    },
    {
        collection: 'food_notifications',
        timestamps: true
    }
);

notificationSchema.index({ ownerType: 1, ownerId: 1, createdAt: -1 });
notificationSchema.index({ ownerType: 1, ownerId: 1, isRead: 1, dismissedAt: 1 });
notificationSchema.index({ broadcastId: 1, ownerType: 1, ownerId: 1 }, { unique: true, sparse: true });

export const FoodNotification = mongoose.model('FoodNotification', notificationSchema);
