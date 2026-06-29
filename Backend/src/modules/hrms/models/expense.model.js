import mongoose from 'mongoose';

/**
 * HRMS Travel & Visit Expense
 * Restructured to support detailed travel/visit reimbursement claims.
 */
const hrmsExpenseSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HrmsEmployee',
            required: true
        },

        // Visit Details
        visitDate: { type: Date, required: true },
        purpose: { type: String, required: true, trim: true },

        // Itemized Costs
        travelDistanceKm: { type: Number, default: 0 },
        travelCost: { type: Number, default: 0 },
        hotelCost: { type: Number, default: 0 },
        foodCost: { type: Number, default: 0 },
        otherExpenses: { type: Number, default: 0 },

        // Total (auto-calculated)
        totalAmount: { type: Number, default: 0 },

        // Attachments (bills, receipts)
        attachments: [{
            name: { type: String },
            url: { type: String }
        }],

        remarks: { type: String, trim: true },

        // Approval workflow
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected', 'Reimbursed'],
            default: 'Pending'
        },
        approvedAmount: { type: Number },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HrmsEmployee'
        },
        rejectionReason: { type: String, trim: true },
        approvedAt: { type: Date },

        // Link to salary for reimbursement tracking
        salaryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HrmsSalary'
        }
    },
    {
        timestamps: true,
        collection: 'hrms_expenses'
    }
);

// Auto-calculate total before save
hrmsExpenseSchema.pre('save', function (next) {
    if (this.isModified('travelCost') || this.isModified('hotelCost') ||
        this.isModified('foodCost') || this.isModified('otherExpenses')) {
        this.totalAmount = (
            (Number(this.travelCost) || 0) +
            (Number(this.hotelCost) || 0) +
            (Number(this.foodCost) || 0) +
            (Number(this.otherExpenses) || 0)
        );
    }
    next();
});

hrmsExpenseSchema.index({ employeeId: 1 });
hrmsExpenseSchema.index({ status: 1 });
hrmsExpenseSchema.index({ visitDate: -1 });

export const HrmsExpense = mongoose.model('HrmsExpense', hrmsExpenseSchema, 'hrms_expenses');
