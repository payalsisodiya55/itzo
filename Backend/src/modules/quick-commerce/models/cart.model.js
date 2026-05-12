import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'quick_product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
}, { _id: false });

const quickCartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodUser', default: null },
  sessionId: { type: String, default: '', trim: true },
  items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });

quickCartSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $exists: true, $ne: null } },
  }
);

quickCartSchema.index(
  { sessionId: 1 },
  {
    unique: true,
    partialFilterExpression: { sessionId: { $exists: true, $type: 'string', $ne: '' } },
  }
);

export const QuickCart = mongoose.model('quick_cart', quickCartSchema, 'quick_carts');
