import express from 'express';
import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    getMyProfile,
    updateEmployee,
    updateEmployeeStatus,
    getEmployeeStats,
    getTeamMembers,
    requestProfileUpdate,
    getPendingProfileEdits,
    approveProfileEdit
} from '../controllers/employee.controller.js';
import { authMiddleware, requireAdmin } from '../../../core/auth/auth.middleware.js';
import { requireHrmsEmployee } from '../middleware/hrmsAuth.middleware.js';

const router = express.Router();

// EMPLOYEE: Get own profile
router.get('/me', authMiddleware, requireHrmsEmployee, getMyProfile);
// EMPLOYEE: Request profile update
router.post('/me/edit-request', authMiddleware, requireHrmsEmployee, requestProfileUpdate);

// ADMIN: Get pending profile edits
router.get('/pending-edits', authMiddleware, requireAdmin, getPendingProfileEdits);

// EMPLOYEE/MANAGER: Get team members
router.get('/team', authMiddleware, requireHrmsEmployee, getTeamMembers);

// ADMIN: Employee management
router.get('/stats', authMiddleware, requireAdmin, getEmployeeStats);
router.post('/', authMiddleware, requireAdmin, createEmployee);
router.get('/', authMiddleware, requireAdmin, getEmployees);
router.get('/:id', authMiddleware, requireAdmin, getEmployeeById);
router.put('/:id', authMiddleware, requireAdmin, updateEmployee);
router.patch('/:id/status', authMiddleware, requireAdmin, updateEmployeeStatus);
router.post('/:id/edit-request/action', authMiddleware, requireAdmin, approveProfileEdit);

export default router;
