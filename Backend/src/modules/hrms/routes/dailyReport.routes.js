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
// Employees can create/update their reports
router.post('/', authMiddleware, requireHrmsEmployee, createOrUpdateReport);
// Employees get their own reports
router.get('/me', authMiddleware, requireHrmsEmployee, getMyReports);

// =====================================
// SHARED / DETAILS & REPLY
// =====================================
// Both employees and managers/admins use these for a specific report
router.get('/:id', authMiddleware, getReportDetails);
router.post('/:id/reply', authMiddleware, replyToReport);

// =====================================
// MANAGER & ADMIN ROUTES
// =====================================
router.get('/admin/all', authMiddleware, requireAdminOrManager, getAllReports);
router.get('/admin/dashboard', authMiddleware, requireAdminOrManager, getAdminDashboardStats);
router.put('/admin/:id/status', authMiddleware, requireAdminOrManager, updateReportStatus);

// =====================================
// ADMIN ONLY ROUTES
// =====================================
router.put('/admin/settings', authMiddleware, requireAdmin, updateSettings);

export default router;
