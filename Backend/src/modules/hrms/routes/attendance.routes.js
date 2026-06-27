import express from 'express';
import { checkIn, checkOut, requestRegularization, getMyAttendance, getAllAttendance } from '../controllers/attendance.controller.js';
import { authMiddleware, requireAdmin, checkPermission } from '../../../core/auth/auth.middleware.js';

const router = express.Router();

// --- Employee Portal Routes (HRMS_EMPLOYEE) ---
router.post('/check-in', authMiddleware, checkIn);
router.post('/check-out', authMiddleware, checkOut);
router.post('/regularize', authMiddleware, requestRegularization);
router.get('/me', authMiddleware, getMyAttendance);

// --- Admin Panel Routes (ECS) ---
router.get('/', authMiddleware, requireAdmin, checkPermission('hrms::attendance', 'view'), getAllAttendance);

export default router;
