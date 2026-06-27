import express from 'express';
import { getMySalaries, getAllSalaries, generatePayroll } from '../controllers/salary.controller.js';
import { authMiddleware, requireAdmin, checkPermission } from '../../../core/auth/auth.middleware.js';

const router = express.Router();

// --- Employee Portal Routes (HRMS_EMPLOYEE) ---
router.get('/me', authMiddleware, getMySalaries);

// --- Admin Panel Routes (ECS) ---
router.get('/', authMiddleware, requireAdmin, checkPermission('hrms::payroll', 'view'), getAllSalaries);
router.post('/generate', authMiddleware, requireAdmin, checkPermission('hrms::payroll', 'create'), generatePayroll);

export default router;
