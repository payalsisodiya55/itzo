import { HrmsEmployee } from '../models/employee.model.js';
import { sendError } from '../../../utils/response.js';

/**
 * Ensures the authenticated user is an HRMS_EMPLOYEE with an active employee profile.
 * Attaches req.hrmsEmployee for downstream use.
 */
export const requireHrmsEmployee = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            return sendError(res, 401, 'Authentication required');
        }

        // Allow HRMS_EMPLOYEE, also allow ADMIN for admin-as-employee scenarios
        if (req.user.role !== 'HRMS_EMPLOYEE' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return sendError(res, 403, 'HRMS Employee access required');
        }

        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId }).lean();
        if (!employee) {
            return sendError(res, 404, 'HRMS Employee profile not found');
        }

        if (employee.status !== 'Active') {
            return sendError(res, 403, 'Employee account is not active');
        }

        req.hrmsEmployee = employee;
        next();
    } catch (error) {
        return sendError(res, 500, `HRMS auth error: ${error.message}`);
    }
};

/**
 * Ensures the authenticated user is a Manager (hrmsRole = 'Manager' or 'HR').
 * Must be used after requireHrmsEmployee.
 */
export const requireHrmsManager = async (req, res, next) => {
    try {
        if (!req.hrmsEmployee) {
            return sendError(res, 403, 'Employee profile required');
        }

        if (req.hrmsEmployee.hrmsRole !== 'Manager' && req.hrmsEmployee.hrmsRole !== 'HR') {
            return sendError(res, 403, 'Manager or HR access required');
        }

        next();
    } catch (error) {
        return sendError(res, 500, `HRMS auth error: ${error.message}`);
    }
};

/**
 * Allows access for either ECS Admin OR HRMS Manager.
 * Useful for approval endpoints.
 */
export const requireAdminOrManager = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            return sendError(res, 401, 'Authentication required');
        }

        // Admin bypass
        if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
            return next();
        }

        // Check if HRMS Manager (from HRMS Portal or ECS Admin Portal)
        if (req.user.role === 'HRMS_EMPLOYEE' || req.user.role === 'EMPLOYEE') {
            const query = req.user.role === 'EMPLOYEE' ? { adminId: req.user.userId } : { _id: req.user.userId };
            const employee = await HrmsEmployee.findOne(query).lean();
            if (employee && employee.status === 'Active' &&
                (employee.hrmsRole === 'Manager' || employee.hrmsRole === 'HR' || employee.hrmsRole === 'Admin')) {
                req.hrmsEmployee = employee;
                return next();
            }
        }

        return sendError(res, 403, 'Admin or Manager access required');
    } catch (error) {
        return sendError(res, 500, `HRMS auth error: ${error.message}`);
    }
};
