import mongoose from 'mongoose';

const hrmsSalarySchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HrmsEmployee',
            required: true
        },
        month: { type: Number, required: true }, // 1-12
        year: { type: Number, required: true }, // e.g., 2026
        
        // Base Compensation
        ctc: { type: Number, required: true },
        baseMonthlySalary: { type: Number, required: true },

        // Working metrics for the month
        totalDays: { type: Number, required: true },
        workingDays: { type: Number, required: true },
        presentDays: { type: Number, default: 0 },
        paidLeavesTaken: { type: Number, default: 0 },
        lopDays: { type: Number, default: 0 },
        totalShortHours: { type: Number, default: 0 },

        // Calculations
        grossEarnings: { type: Number, default: 0 },
        
        deductions: {
            lopAmount: { type: Number, default: 0 },
            shortHoursAmount: { type: Number, default: 0 },
            taxes: { type: Number, default: 0 },
            otherDeductions: { type: Number, default: 0 }
        },
        
        reimbursements: { type: Number, default: 0 }, // From approved expenses
        
        netSalary: { type: Number, required: true }, // Final amount to pay

        // Status & Delivery
        status: {
            type: String,
            enum: ['Draft', 'Approved', 'Paid'],
            default: 'Draft'
        },
        paymentDate: { type: Date },
        payslipUrl: { type: String } // URL to generated PDF
    },
    {
        timestamps: true,
        collection: 'hrms_salaries'
    }
);

hrmsSalarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export const HrmsSalary = mongoose.model('HrmsSalary', hrmsSalarySchema, 'hrms_salaries');
