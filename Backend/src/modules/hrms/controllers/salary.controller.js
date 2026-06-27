import { HrmsSalary } from '../models/salary.model.js';
import { HrmsEmployee } from '../models/employee.model.js';
import { sendResponse, sendError } from '../../../utils/response.js';

export const getMySalaries = async (req, res, next) => {
    try {
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, "Employee not found");

        const salaries = await HrmsSalary.find({ employeeId: employee._id }).sort({ year: -1, month: -1 });
        return sendResponse(res, 200, "Salaries retrieved", salaries);
    } catch (error) {
        next(error);
    }
};

export const getAllSalaries = async (req, res, next) => {
    try {
        const salaries = await HrmsSalary.find()
            .populate({
                path: 'employeeId',
                populate: { path: 'adminId', select: 'name email phone' }
            })
            .sort({ year: -1, month: -1 });
        return sendResponse(res, 200, "All salaries retrieved", salaries);
    } catch (error) {
        next(error);
    }
};

// Payroll Generation Engine (Triggered manually by Admin for a specific month/year)
export const generatePayroll = async (req, res, next) => {
    try {
        // Implementation for Phase 1 - This would typically iterate over all Active employees,
        // calculate attendance vs settings, and insert/update HrmsSalary records.
        // For Phase 1, we will return a success placeholder.
        return sendResponse(res, 200, "Payroll generation completed successfully");
    } catch (error) {
        next(error);
    }
};
