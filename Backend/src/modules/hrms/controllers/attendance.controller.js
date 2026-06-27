import { HrmsAttendance } from '../models/attendance.model.js';
import { HrmsEmployee } from '../models/employee.model.js';
import { HrmsSettings } from '../models/settings.model.js';
import { sendResponse, sendError } from '../../../utils/response.js';

const getNormalizedDate = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const checkIn = async (req, res, next) => {
    try {
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, "Employee not found");

        const today = getNormalizedDate();
        let attendance = await HrmsAttendance.findOne({ employeeId: employee._id, date: today });
        
        if (attendance && attendance.checkInTime) {
            return sendError(res, 400, "Already checked in today");
        }

        if (!attendance) {
            attendance = new HrmsAttendance({ employeeId: employee._id, date: today });
        }

        attendance.checkInTime = new Date();
        attendance.status = 'Present'; // Implicit status until check-out
        
        await attendance.save();
        return sendResponse(res, 200, "Checked in successfully", attendance);
    } catch (error) {
        next(error);
    }
};

export const checkOut = async (req, res, next) => {
    try {
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, "Employee not found");

        const today = getNormalizedDate();
        let attendance = await HrmsAttendance.findOne({ employeeId: employee._id, date: today });
        
        if (!attendance || !attendance.checkInTime) {
            return sendError(res, 400, "No check-in found for today");
        }

        attendance.checkOutTime = new Date();
        
        // Calculate working hours
        const diffMs = attendance.checkOutTime - attendance.checkInTime;
        const hours = diffMs / (1000 * 60 * 60);
        attendance.workingHours = Number(hours.toFixed(2));

        // Evaluate Short Hours against Settings
        const settings = await HrmsSettings.findOne();
        const minHours = settings?.workingHours?.minimumWorkingHours || 8;
        
        if (attendance.workingHours < minHours) {
            attendance.shortHours = Number((minHours - attendance.workingHours).toFixed(2));
        }

        await attendance.save();
        return sendResponse(res, 200, "Checked out successfully", attendance);
    } catch (error) {
        next(error);
    }
};

export const requestRegularization = async (req, res, next) => {
    try {
        const { date, requestedCheckInTime, requestedCheckOutTime, reason } = req.body;
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, "Employee not found");

        const normDate = getNormalizedDate(date);
        let attendance = await HrmsAttendance.findOne({ employeeId: employee._id, date: normDate });
        
        if (!attendance) {
            attendance = new HrmsAttendance({ employeeId: employee._id, date: normDate });
        }

        attendance.regularization = {
            isRequested: true,
            requestedCheckInTime,
            requestedCheckOutTime,
            reason,
            status: 'Pending'
        };

        await attendance.save();
        return sendResponse(res, 200, "Regularization requested successfully", attendance);
    } catch (error) {
        next(error);
    }
};

export const getMyAttendance = async (req, res, next) => {
    try {
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, "Employee not found");
        
        const records = await HrmsAttendance.find({ employeeId: employee._id }).sort({ date: -1 });
        return sendResponse(res, 200, "Attendance retrieved", records);
    } catch (error) {
        next(error);
    }
};

export const getAllAttendance = async (req, res, next) => {
    try {
        const records = await HrmsAttendance.find()
            .populate({
                path: 'employeeId',
                populate: { path: 'adminId', select: 'name email phone' }
            })
            .sort({ date: -1 });
        return sendResponse(res, 200, "All attendance retrieved", records);
    } catch (error) {
        next(error);
    }
};
