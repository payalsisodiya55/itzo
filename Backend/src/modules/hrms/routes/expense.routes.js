import express from 'express';
import {
    submitExpense,
    getMyExpenses,
    getAllExpenses,
    approveExpense
} from '../controllers/expense.controller.js';
import { authMiddleware } from '../../../core/auth/auth.middleware.js';
import { requireHrmsEmployee, requireAdminOrManager } from '../middleware/hrmsAuth.middleware.js';

const router = express.Router();

// EMPLOYEE: Submit and view expenses
router.post('/', authMiddleware, requireHrmsEmployee, submitExpense);
router.get('/me', authMiddleware, requireHrmsEmployee, getMyExpenses);

// ADMIN/MANAGER: Manage expenses
router.get('/', authMiddleware, requireAdminOrManager, getAllExpenses);
router.post('/:id/action', authMiddleware, requireAdminOrManager, approveExpense);

export default router;
