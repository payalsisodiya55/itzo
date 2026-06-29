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
        if (!employee) return sendError(res, 404, 'Employee not found');
        if (employee.status !== 'Active') return sendError(res, 403, 'Employee account is not active');

        const today = getNormalizedDate();
        let attendance = await HrmsAttendance.findOne({ employeeId: employee._id, date: today });

        if (attendance && attendance.checkInTime) {
            return sendError(res, 400, 'Already checked in today');
        }

        if (!attendance) {
            attendance = new HrmsAttendance({ employeeId: employee._id, date: today });
        }

        attendance.checkInTime = new Date();
        attendance.status = 'Present';

        await attendance.save();
        return sendResponse(res, 200, 'Checked in successfully', attendance);
    } catch (error) {
        next(error);
    }
};

export const checkOut = async (req, res, next) => {
    try {
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, 'Employee not found');

        const today = getNormalizedDate();
        const attendance = await HrmsAttendance.findOne({ employeeId: employee._id, date: today });

        if (!attendance || !attendance.checkInTime) {
            return sendError(res, 400, 'No check-in found for today');
        }
        if (attendance.checkOutTime) {
            return sendError(res, 400, 'Already checked out today');
        }

        attendance.checkOutTime = new Date();

        // Calculate working hours
        const diffMs = attendance.checkOutTime - attendance.checkInTime;
        const hours = diffMs / (1000 * 60 * 60);
        attendance.workingHours = Number(hours.toFixed(2));

        // Evaluate short hours against settings
        const settings = await HrmsSettings.findOne().lean();
        const minHours = settings?.workingHours?.minimumWorkingHours || 8;

        if (attendance.workingHours < minHours) {
            attendance.shortHours = Number((minHours - attendance.workingHours).toFixed(2));
        } else {
            attendance.shortHours = 0;
            // Calculate overtime
            if (attendance.workingHours > minHours) {
                attendance.overtimeHours = Number((attendance.workingHours - minHours).toFixed(2));
            }
        }

        await attendance.save();
        return sendResponse(res, 200, 'Checked out successfully', attendance);
    } catch (error) {
        next(error);
    }
};

export const requestRegularization = async (req, res, next) => {
    try {
        const { date, requestedCheckInTime, requestedCheckOutTime, reason } = req.body;
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, 'Employee not found');

        if (!date || !requestedCheckInTime || !requestedCheckOutTime || !reason) {
            return sendError(res, 400, 'Date, check-in time, check-out time, and reason are required');
        }

        const normDate = getNormalizedDate(date);

        // Don't allow future date regularization
        if (normDate > getNormalizedDate()) {
            return sendError(res, 400, 'Cannot regularize attendance for a future date');
        }

        let attendance = await HrmsAttendance.findOne({ employeeId: employee._id, date: normDate });

        if (!attendance) {
            attendance = new HrmsAttendance({ employeeId: employee._id, date: normDate });
        }

        if (attendance.regularization?.status === 'Pending') {
            return sendError(res, 400, 'A regularization request is already pending for this date');
        }

        attendance.regularization = {
            isRequested: true,
            requestedCheckInTime: new Date(requestedCheckInTime),
            requestedCheckOutTime: new Date(requestedCheckOutTime),
            reason,
            status: 'Pending'
        };

        await attendance.save();
        return sendResponse(res, 200, 'Regularization requested successfully', attendance);
    } catch (error) {
        next(error);
    }
};

/**
 * MANAGER/ADMIN: Approve regularization request
 */
export const approveRegularization = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'Approved' or 'Rejected'

        const attendance = await HrmsAttendance.findById(id);
        if (!attendance) return sendError(res, 404, 'Attendance record not found');

        if (!attendance.regularization?.isRequested) {
            return sendError(res, 400, 'No regularization request found');
        }

        if (attendance.regularization.status !== 'Pending') {
            return sendError(res, 400, `Regularization is already ${attendance.regularization.status}`);
        }

        // Manager scope check — can only approve reporting employees
        if (req.user.role === 'HRMS_EMPLOYEE' && req.hrmsEmployee) {
            const targetEmployee = await HrmsEmployee.findById(attendance.employeeId).lean();
            if (!targetEmployee || String(targetEmployee.managerId) !== String(req.hrmsEmployee._id)) {
                return sendError(res, 403, 'You can only approve regularization for your team members');
            }
            // Prevent self-approval
            if (String(attendance.employeeId) === String(req.hrmsEmployee._id)) {
                return sendError(res, 403, 'You cannot approve your own regularization request');
            }
        }

        const approverEmployee = await HrmsEmployee.findOne({ adminId: req.user.userId });

        if (action === 'Approved') {
            attendance.regularization.status = 'Approved';
            attendance.regularization.approvedBy = approverEmployee?._id;

            // Apply the regularized times
            attendance.checkInTime = attendance.regularization.requestedCheckInTime;
            attendance.checkOutTime = attendance.regularization.requestedCheckOutTime;
            attendance.status = 'Present';

            // Recalculate working hours
            const diffMs = attendance.checkOutTime - attendance.checkInTime;
            const hours = diffMs / (1000 * 60 * 60);
            attendance.workingHours = Number(hours.toFixed(2));

            const settings = await HrmsSettings.findOne().lean();
            const minHours = settings?.workingHours?.minimumWorkingHours || 8;
            attendance.shortHours = attendance.workingHours < minHours
                ? Number((minHours - attendance.workingHours).toFixed(2))
                : 0;
            attendance.overtimeHours = attendance.workingHours > minHours
                ? Number((attendance.workingHours - minHours).toFixed(2))
                : 0;
        } else {
            attendance.regularization.status = 'Rejected';
            attendance.regularization.approvedBy = approverEmployee?._id;
        }

        await attendance.save();
        return sendResponse(res, 200, `Regularization ${action.toLowerCase()}`, attendance);
    } catch (error) {
        next(error);
    }
};

/**
 * EMPLOYEE: Get own attendance records
 */
export const getMyAttendance = async (req, res, next) => {
    try {
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, 'Employee not found');

        const { month, year } = req.query;
        const filter = { employeeId: employee._id };

        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const records = await HrmsAttendance.find(filter).sort({ date: -1 }).lean();
        return sendResponse(res, 200, 'Attendance retrieved', records);
    } catch (error) {
        next(error);
    }
};

/**
 * ADMIN: Get all attendance records with filters
 */
export const getAllAttendance = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, date, month, year, employeeId } = req.query;
        const filter = {};

        if (employeeId) filter.employeeId = employeeId;

        if (date) {
            filter.date = getNormalizedDate(date);
        } else if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [records, total] = await Promise.all([
            HrmsAttendance.find(filter)
                .populate({
                    path: 'employeeId',
                    populate: { path: 'adminId', select: 'name email phone' }
                })
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            HrmsAttendance.countDocuments(filter)
        ]);

        return sendResponse(res, 200, 'All attendance retrieved', {
            records,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * ADMIN/MANAGER: Get pending regularization requests
 */
export const getPendingRegularizations = async (req, res, next) => {
    try {
        const filter = { 'regularization.isRequested': true, 'regularization.status': 'Pending' };

        // If manager, scope to team only
        if (req.user.role === 'HRMS_EMPLOYEE' && req.hrmsEmployee) {
            const teamIds = await HrmsEmployee.find({ managerId: req.hrmsEmployee._id })
                .select('_id').lean();
            filter.employeeId = { $in: teamIds.map(t => t._id) };
        }

        const records = await HrmsAttendance.find(filter)
            .populate({
                path: 'employeeId',
                populate: { path: 'adminId', select: 'name email' }
            })
            .sort({ createdAt: -1 })
            .lean();

        return sendResponse(res, 200, 'Pending regularizations retrieved', records);
    } catch (error) {
        next(error);
    }
};
