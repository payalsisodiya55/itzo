import { HrmsLeave } from '../models/leave.model.js';
import { HrmsEmployee } from '../models/employee.model.js';
import { sendResponse, sendError } from '../../../utils/response.js';

export const applyLeave = async (req, res, next) => {
    try {
        const { startDate, endDate, leaveType, reason, attachmentUrl } = req.body;
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, "Employee not found");

        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end < start) {
            return sendError(res, 400, "End date cannot be before start date");
        }

        const diffTime = Math.abs(end - start);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const newLeave = new HrmsLeave({
            employeeId: employee._id,
            startDate,
            endDate,
            leaveType,
            reason,
            totalDays,
            attachmentUrl
        });

        await newLeave.save();
        return sendResponse(res, 201, "Leave applied successfully", newLeave);
    } catch (error) {
        next(error);
    }
};

export const getMyLeaves = async (req, res, next) => {
    try {
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, "Employee not found");

        const leaves = await HrmsLeave.find({ employeeId: employee._id }).sort({ createdAt: -1 });
        return sendResponse(res, 200, "Leaves retrieved", leaves);
    } catch (error) {
        next(error);
    }
};

export const getAllLeaves = async (req, res, next) => {
    try {
        const leaves = await HrmsLeave.find()
            .populate({
                path: 'employeeId',
                populate: { path: 'adminId', select: 'name email phone' }
            })
            .sort({ createdAt: -1 });
        return sendResponse(res, 200, "All leaves retrieved", leaves);
    } catch (error) {
        next(error);
    }
};

export const updateLeaveStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        
        const leave = await HrmsLeave.findById(id);
        if (!leave) return sendError(res, 404, "Leave request not found");

        leave.status = status;
        if (status === 'Rejected') {
            leave.rejectionReason = rejectionReason;
        }

        const adminEmp = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (adminEmp) {
            leave.approvedBy = adminEmp._id;
        }

        await leave.save();
        return sendResponse(res, 200, "Leave status updated", leave);
    } catch (error) {
        next(error);
    }
};
