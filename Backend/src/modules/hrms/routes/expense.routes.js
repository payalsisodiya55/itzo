import express from 'express';
import { submitExpense, getMyExpenses, getAllExpenses, updateExpenseStatus } from '../controllers/expense.controller.js';
import { authMiddleware, requireAdmin, checkPermission } from '../../../core/auth/auth.middleware.js';

const router = express.Router();

// --- Employee Portal Routes (HRMS_EMPLOYEE) ---
router.post('/', authMiddleware, submitExpense);
router.get('/me', authMiddleware, getMyExpenses);

// --- Admin Panel Routes (ECS) ---
router.get('/', authMiddleware, requireAdmin, checkPermission('hrms::expenses', 'view'), getAllExpenses);
router.patch('/:id/status', authMiddleware, requireAdmin, checkPermission('hrms::expenses', 'edit'), updateExpenseStatus);

export default router;
