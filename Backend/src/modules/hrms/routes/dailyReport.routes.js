import express from 'express';
import { authMiddleware, requireAdmin } from '../../../core/auth/auth.middleware.js';
import { requireHrmsEmployee, requireAdminOrManager } from '../middleware/hrmsAuth.middleware.js';
import {
    getSettings,
    createOrUpdateReport,
    getMyReports,
    getReportDetails,
    replyToReport,
    getAllReports,
    updateReportStatus,
    updateSettings,
    getAdminDashboardStats
} from '../controllers/dailyReport.controller.js';

const router = express.Router();

// =====================================
// SHARED
// =====================================
router.get('/settings', authMiddleware, getSettings);

// =====================================
// EMPLOYEE ROUTES
// =====================================
router.post('/', authMiddleware, requireHrmsEmployee, createOrUpdateReport);
router.get('/me', authMiddleware, requireHrmsEmployee, getMyReports);

// =====================================
// MANAGER & ADMIN ROUTES (must be before /:id)
// =====================================
router.get('/admin/all', authMiddleware, requireAdminOrManager, getAllReports);
router.get('/admin/dashboard', authMiddleware, requireAdminOrManager, getAdminDashboardStats);
router.put('/admin/settings', authMiddleware, requireAdmin, updateSettings);
router.put('/admin/:id/status', authMiddleware, requireAdminOrManager, updateReportStatus);

// =====================================
// PARAMETERIZED ROUTES (must be last)
// =====================================
router.get('/:id', authMiddleware, getReportDetails);
router.post('/:id/reply', authMiddleware, replyToReport);

export default router;
