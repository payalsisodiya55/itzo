import mongoose from "mongoose";

const sellerReturnSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
    },
    customer: {
      name: { type: String, trim: true, default: "Customer" },
      phone: { type: String, trim: true, default: "" },
    },
    returnStatus: {
      type: String,
      enum: [
        "return_requested",
        "return_approved",
        "return_rejected",
        "return_pickup_assigned",
        "return_in_transit",
        "returned",
        "refund_completed",
      ],
      default: "return_requested",
    },
    returnReason: {
      type: String,
      trim: true,
      default: "",
    },
    returnRejectedReason: {
      type: String,
      trim: true,
      default: "",
    },
    returnRequestedAt: {
      type: Date,
      default: Date.now,
    },
    returnItems: {
      type: [
        new mongoose.Schema(
          {
            name: { type: String, trim: true, default: "" },
            quantity: { type: Number, min: 1, default: 1 },
            price: { type: Number, min: 0, default: 0 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    pricing: {
      subtotal: { type: Number, min: 0, default: 0 },
    },
    returnRefundAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    returnDeliveryCommission: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    collection: 'quick_seller_returns',
    timestamps: true,
  },
);

sellerReturnSchema.index({ sellerId: 1, returnRequestedAt: -1 });
sellerReturnSchema.index({ sellerId: 1, orderId: 1 }, { unique: true });

export const SellerReturn = mongoose.model('SellerReturn', sellerReturnSchema, 'quick_seller_returns');
