import mongoose from 'mongoose';

const hrmsLeaveSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HrmsEmployee',
            required: true
        },
        leaveType: { type: String, required: true }, // e.g., 'Sick Leave', 'Casual Leave'
        
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        totalDays: { type: Number, required: true },
        
        reason: { type: String, required: true, trim: true },
        attachmentUrl: { type: String },

        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
            default: 'Pending'
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HrmsEmployee' // Usually their manager
        },
        rejectionReason: { type: String }
    },
    {
        timestamps: true,
        collection: 'hrms_leave_requests'
    }
);

hrmsLeaveSchema.index({ employeeId: 1 });
hrmsLeaveSchema.index({ status: 1 });

export const HrmsLeave = mongoose.model('HrmsLeave', hrmsLeaveSchema, 'hrms_leave_requests');
