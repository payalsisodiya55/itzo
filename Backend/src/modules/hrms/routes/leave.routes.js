import express from 'express';
import { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus } from '../controllers/leave.controller.js';
import { authMiddleware, requireAdmin, checkPermission } from '../../../core/auth/auth.middleware.js';

const router = express.Router();

// --- Employee Portal Routes (HRMS_EMPLOYEE) ---
router.post('/', authMiddleware, applyLeave);
router.get('/me', authMiddleware, getMyLeaves);

// --- Admin Panel Routes (ECS) ---
router.get('/', authMiddleware, requireAdmin, checkPermission('hrms::leaves', 'view'), getAllLeaves);
router.patch('/:id/status', authMiddleware, requireAdmin, checkPermission('hrms::leaves', 'edit'), updateLeaveStatus);

export default router;
