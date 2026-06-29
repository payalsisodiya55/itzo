import express from 'express';
import {
    generatePayroll,
    approvePayroll,
    markPayrollPaid,
    getPayroll,
    getMySalary,
    getPayslipDetail,
    uploadPayslip
} from '../controllers/salary.controller.js';
import { authMiddleware, requireAdmin } from '../../../core/auth/auth.middleware.js';
import { requireHrmsEmployee } from '../middleware/hrmsAuth.middleware.js';

const router = express.Router();

// EMPLOYEE: View own salary
router.get('/me', authMiddleware, requireHrmsEmployee, getMySalary);
router.get('/payslip/:id', authMiddleware, requireHrmsEmployee, getPayslipDetail);

// ADMIN: Payroll management
router.post('/generate', authMiddleware, requireAdmin, generatePayroll);
router.post('/approve', authMiddleware, requireAdmin, approvePayroll);
router.post('/mark-paid', authMiddleware, requireAdmin, markPayrollPaid);
router.post('/:id/upload-payslip', authMiddleware, requireAdmin, uploadPayslip);
router.get('/', authMiddleware, requireAdmin, getPayroll);

export default router;
