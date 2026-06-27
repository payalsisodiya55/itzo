import mongoose from 'mongoose';

const hrmsAttendanceSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HrmsEmployee',
            required: true
        },
        date: { type: Date, required: true }, // Normalized to start of day
        
        checkInTime: { type: Date },
        checkOutTime: { type: Date },
        
        // Calculated fields based on HrmsSettings
        workingHours: { type: Number, default: 0 },
        shortHours: { type: Number, default: 0 },
        overtimeHours: { type: Number, default: 0 },
        
        // Status tracking
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Half-Day', 'Leave', 'Holiday', 'Weekend'],
            default: 'Absent'
        },

        // Regularization Flow
        regularization: {
            isRequested: { type: Boolean, default: false },
            requestedCheckInTime: { type: Date },
            requestedCheckOutTime: { type: Date },
            reason: { type: String },
            status: { 
                type: String, 
                enum: ['Pending', 'Approved', 'Rejected'], 
                default: 'Pending' 
            },
            approvedBy: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'HrmsEmployee' 
            }
        },

        // Geolocation/Device tracking for check-in
        checkInLocation: { type: String },
        checkOutLocation: { type: String }
    },
    {
        timestamps: true,
        collection: 'hrms_attendance'
    }
);

// Ensure one attendance record per employee per day
hrmsAttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const HrmsAttendance = mongoose.model('HrmsAttendance', hrmsAttendanceSchema, 'hrms_attendance');
