import mongoose from 'mongoose';

const hrmsExpenseSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HrmsEmployee',
            required: true
        },
        expenseDate: { type: Date, required: true },
        
        category: { type: String, required: true }, // Travel, Food, Hotel, etc.
        
        // Travel specific
        travelDistanceKm: { type: Number, default: 0 },
        
        // Costs
        amount: { type: Number, required: true },
        
        description: { type: String, trim: true },
        receiptUrl: { type: String },

        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected', 'Reimbursed'],
            default: 'Pending'
        },
        
        approvedAmount: { type: Number }, // May be different from claimed amount
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HrmsEmployee'
        },
        rejectionReason: { type: String }
    },
    {
        timestamps: true,
        collection: 'hrms_expenses'
    }
);

hrmsExpenseSchema.index({ employeeId: 1 });
hrmsExpenseSchema.index({ status: 1 });

export const HrmsExpense = mongoose.model('HrmsExpense', hrmsExpenseSchema, 'hrms_expenses');
