import express from 'express';
import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    getMyProfile,
    updateEmployee,
    updateEmployeeStatus,
    getEmployeeStats,
    getTeamMembers
} from '../controllers/employee.controller.js';
import { authMiddleware, requireAdmin } from '../../../core/auth/auth.middleware.js';
import { requireHrmsEmployee } from '../middleware/hrmsAuth.middleware.js';

const router = express.Router();

// EMPLOYEE: Get own profile
router.get('/me', authMiddleware, requireHrmsEmployee, getMyProfile);

// EMPLOYEE/MANAGER: Get team members
router.get('/team', authMiddleware, requireHrmsEmployee, getTeamMembers);

// ADMIN: Employee management
router.get('/stats', authMiddleware, requireAdmin, getEmployeeStats);
router.post('/', authMiddleware, requireAdmin, createEmployee);
router.get('/', authMiddleware, requireAdmin, getEmployees);
router.get('/:id', authMiddleware, requireAdmin, getEmployeeById);
router.put('/:id', authMiddleware, requireAdmin, updateEmployee);
router.patch('/:id/status', authMiddleware, requireAdmin, updateEmployeeStatus);

export default router;
