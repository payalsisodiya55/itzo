import mongoose from 'mongoose';

const sellerCommissionSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Seller',
            required: true,
            unique: true,
            index: true
        },
        defaultCommission: {
            type: {
                type: String,
                enum: ['percentage', 'amount'],
                default: 'percentage'
            },
            value: { type: Number, default: 0 }
        },
        notes: { type: String, trim: true, default: '' },
        status: { type: Boolean, default: true, index: true }
    },
    { collection: 'quick_seller_commissions', timestamps: true }
);

export const QuickSellerCommission = mongoose.model('QuickSellerCommission', sellerCommissionSchema, 'quick_seller_commissions');
