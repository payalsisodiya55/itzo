import mongoose from 'mongoose';

const hrmsSettingsSchema = new mongoose.Schema(
    {
        // 1. Company Policies & Working Hours
        workingHours: {
            minimumWorkingHours: { type: Number, default: 8 }, // Default 8 hours
            gracePeriodMinutes: { type: Number, default: 15 },
            shortHourDeductionRate: { type: Number, default: 1 }, // E.g., 1x or 0.5x hourly rate deduction
            overtimeRate: { type: Number, default: 1.5 }, // E.g., 1.5x hourly rate
        },

        // 2. Leave Policies
        leavePolicies: {
            paidLeavesPerMonth: { type: Number, default: 1.5 },
            maxAccumulatedLeaves: { type: Number, default: 18 },
            leaveTypes: [{
                name: { type: String, required: true }, // e.g., 'Sick Leave', 'Casual Leave', 'Earned Leave'
                isPaid: { type: Boolean, default: true }
            }],
            requiresManagerApproval: { type: Boolean, default: true },
        },

        // 3. Payroll Rules
        payrollRules: {
            lopMultiplier: { type: Number, default: 1 }, // Loss of pay deduction multiplier
            salaryCalculationType: { type: String, enum: ['Fixed', 'Attendance_Based'], default: 'Attendance_Based' },
            payPeriod: { type: String, enum: ['Monthly', 'Bi-Weekly'], default: 'Monthly' },
        },

        // 4. Expenses & Travel Policies
        expensePolicies: {
            categories: [{ type: String }], // e.g., 'Travel', 'Food', 'Accommodation', 'Client Meeting'
            maxHotelAllowancePerNight: { type: Number, default: 2000 },
            maxFoodAllowancePerDay: { type: Number, default: 500 },
            travelRatePerKm: { type: Number, default: 5 }, // For distance-based travel claims
            requiresReceiptAbove: { type: Number, default: 500 }, // Require attachment if bill > 500
        },

        // 5. Organizational Structure
        organization: {
            departments: [{
                name: { type: String, required: true },
                headAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodAdmin' }
            }],
            designations: [{ type: String }], // e.g., 'Software Engineer', 'Sales Executive'
            officeLocations: [{
                name: { type: String, required: true },
                address: { type: String },
                city: { type: String }
            }],
            zones: [{ type: String }], // e.g., 'North Zone', 'South Zone'
        },

        // 6. Calendars & Templates
        holidayCalendar: [{
            date: { type: Date, required: true },
            name: { type: String, required: true },
            isOptional: { type: Boolean, default: false }
        }],
        templates: {
            offerLetterHtml: { type: String, default: '<h1>Offer Letter</h1>' },
            salarySlipHtml: { type: String, default: '<h1>Payslip</h1>' },
            welcomeEmailHtml: { type: String, default: '<h1>Welcome to ItzoFood</h1>' }
        },

        // 7. Audit & Modification Tracking
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodAdmin'
        }
    },
    {
        timestamps: true,
        collection: 'hrms_settings'
    }
);

export const HrmsSettings = mongoose.model('HrmsSettings', hrmsSettingsSchema, 'hrms_settings');
