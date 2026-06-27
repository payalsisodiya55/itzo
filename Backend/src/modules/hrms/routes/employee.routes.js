import express from 'express';
import { createEmployee, getEmployees, getMyProfile, updateEmployeeStatus, registerEmployee } from '../controllers/employee.controller.js';
import { authMiddleware, requireAdmin, checkPermission } from '../../../core/auth/auth.middleware.js';

const router = express.Router();

// Public route for employee self-onboarding (Sign Up)
router.post('/register', registerEmployee);

// --- Employee Portal Routes (HRMS_EMPLOYEE) ---
// Note: HRMS_EMPLOYEE role is validated strictly inside getMyProfile or generic authMiddleware
router.get('/me', authMiddleware, getMyProfile);

// --- Admin Panel Routes (ECS) ---
router.post('/', authMiddleware, requireAdmin, checkPermission('hrms::employees', 'create'), createEmployee);
router.get('/', authMiddleware, requireAdmin, checkPermission('hrms::employees', 'view'), getEmployees);
router.patch('/:id/status', authMiddleware, requireAdmin, checkPermission('hrms::employees', 'edit'), updateEmployeeStatus);

export default router;
