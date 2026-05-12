import mongoose from "mongoose";

const sellerNotificationSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["inventory", "order", "payment", "system"],
      default: "system",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: 'quick_seller_notifications',
    timestamps: true,
  },
);

sellerNotificationSchema.index({ sellerId: 1, key: 1 }, { unique: true });
sellerNotificationSchema.index({ sellerId: 1, isRead: 1, createdAt: -1 });

export const SellerNotification = mongoose.model(
  "SellerNotification",
  sellerNotificationSchema,
);
