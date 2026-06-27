import { HrmsEmployee } from '../models/employee.model.js';
import { FoodAdmin } from '../../../core/admin/admin.model.js';
import { sendResponse, sendError } from '../../../utils/response.js';
import mongoose from 'mongoose';

const generateEmployeeId = async () => {
    const count = await HrmsEmployee.countDocuments();
    return `ITZO-EMP-${String(count + 1).padStart(3, '0')}`;
};

export const createEmployee = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            firstName, lastName, email, phone, password,
            department, designation, managerId, employmentType,
            joiningDate, shift, officeLocation, zone, ctc, monthlySalary,
            aadhaarNumber, panNumber, accountHolderName, accountNumber, bankName, ifscCode
        } = req.body;

        // 1. Create Base Credentials in FoodAdmin
        const existingAdmin = await FoodAdmin.findOne({ email }).session(session);
        if (existingAdmin) {
            throw new Error('Email is already in use');
        }

        const newAdmin = new FoodAdmin({
            email,
            password,
            name: `${firstName} ${lastName}`.trim(),
            phone,
            role: 'HRMS_EMPLOYEE',
            isActive: true
        });
        await newAdmin.save({ session });

        // 2. Generate Employee ID
        const employeeId = await generateEmployeeId();

        // 3. Create HRMS Employee Profile
        const newEmployee = new HrmsEmployee({
            adminId: newAdmin._id,
            employeeId,
            department,
            designation,
            managerId: managerId || null,
            employmentType,
            joiningDate,
            shift,
            officeLocation,
            zone,
            ctc,
            monthlySalary,
            documents: {
                aadhaarNumber,
                panNumber,
            },
            bankDetails: {
                accountHolderName,
                accountNumber,
                bankName,
                ifscCode
            }
        });

        await newEmployee.save({ session });
        await session.commitTransaction();

        return sendResponse(res, 201, "Employee onboarded successfully", newEmployee);
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

export const getEmployees = async (req, res, next) => {
    try {
        const employees = await HrmsEmployee.find()
            .populate('adminId', 'name email phone isActive')
            .populate('managerId', 'employeeId adminId');
        
        return sendResponse(res, 200, "Employees retrieved successfully", employees);
    } catch (error) {
        next(error);
    }
};

export const getMyProfile = async (req, res, next) => {
    try {
        // req.user.userId belongs to FoodAdmin. We need to find the HrmsEmployee
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId })
            .populate('adminId', 'name email phone profileImage')
            .populate({
                path: 'managerId',
                populate: { path: 'adminId', select: 'name email' }
            });

        if (!employee) {
            return sendError(res, 404, "Employee profile not found");
        }

        return sendResponse(res, 200, "Profile retrieved successfully", employee);
    } catch (error) {
        next(error);
    }
};

export const updateEmployeeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const employee = await HrmsEmployee.findById(id);
        if (!employee) return sendError(res, 404, "Employee not found");

        employee.status = status;
        await employee.save();

        // Sync with FoodAdmin isActive
        if (status === 'Suspended' || status === 'Terminated' || status === 'Resigned') {
            await FoodAdmin.findByIdAndUpdate(employee.adminId, { isActive: false });
        } else if (status === 'Active') {
            await FoodAdmin.findByIdAndUpdate(employee.adminId, { isActive: true });
        }

        return sendResponse(res, 200, "Employee status updated", employee);
    } catch (error) {
        next(error);
    }
};

export const registerEmployee = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { 
            name, email, phone, password, 
            department, designation, employmentType, 
            joiningDate, officeLocation 
        } = req.body;

        if (!name || !email || !password || !joiningDate) {
            return sendError(res, 400, 'Name, email, password, and joining date are required');
        }

        // 1. Create Base Credentials in FoodAdmin
        const existingAdmin = await FoodAdmin.findOne({ email }).session(session);
        if (existingAdmin) {
            return sendError(res, 400, 'Email is already in use');
        }

        const newAdmin = new FoodAdmin({
            email,
            password,
            phone,
            name: name.trim(),
            role: 'HRMS_EMPLOYEE',
            isActive: true
        });
        await newAdmin.save({ session });

        // 2. Generate Employee ID
        const count = await HrmsEmployee.countDocuments();
        const employeeId = `ITZO-EMP-${String(count + 1).padStart(3, '0')}`;

        // 3. Create HRMS Employee Profile
        const newEmployee = new HrmsEmployee({
            adminId: newAdmin._id,
            employeeId,
            department,
            designation,
            employmentType: employmentType || 'Full-Time',
            joiningDate,
            officeLocation,
            status: 'Active'
        });

        await newEmployee.save({ session });
        await session.commitTransaction();

        return sendResponse(res, 201, "Registration successful", newEmployee);
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};
