import { HrmsExpense } from '../models/expense.model.js';
import { HrmsEmployee } from '../models/employee.model.js';
import { sendResponse, sendError } from '../../../utils/response.js';

export const submitExpense = async (req, res, next) => {
    try {
        const { expenseDate, category, travelDistanceKm, amount, description, receiptUrl } = req.body;
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, "Employee not found");

        const newExpense = new HrmsExpense({
            employeeId: employee._id,
            expenseDate,
            category,
            travelDistanceKm,
            amount,
            description,
            receiptUrl
        });

        await newExpense.save();
        return sendResponse(res, 201, "Expense submitted successfully", newExpense);
    } catch (error) {
        next(error);
    }
};

export const getMyExpenses = async (req, res, next) => {
    try {
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, "Employee not found");

        const expenses = await HrmsExpense.find({ employeeId: employee._id }).sort({ expenseDate: -1 });
        return sendResponse(res, 200, "Expenses retrieved", expenses);
    } catch (error) {
        next(error);
    }
};

export const getAllExpenses = async (req, res, next) => {
    try {
        const expenses = await HrmsExpense.find()
            .populate({
                path: 'employeeId',
                populate: { path: 'adminId', select: 'name email phone' }
            })
            .sort({ expenseDate: -1 });
        return sendResponse(res, 200, "All expenses retrieved", expenses);
    } catch (error) {
        next(error);
    }
};

export const updateExpenseStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, approvedAmount, rejectionReason } = req.body;
        
        const expense = await HrmsExpense.findById(id);
        if (!expense) return sendError(res, 404, "Expense not found");

        expense.status = status;
        if (status === 'Approved' || status === 'Reimbursed') {
            expense.approvedAmount = approvedAmount || expense.amount;
        } else if (status === 'Rejected') {
            expense.rejectionReason = rejectionReason;
        }

        const adminEmp = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (adminEmp) {
            expense.approvedBy = adminEmp._id;
        }

        await expense.save();
        return sendResponse(res, 200, "Expense status updated", expense);
    } catch (error) {
        next(error);
    }
};
