import express from 'express';
import {
    getMyDocuments,
    getEmployeeDocuments,
    uploadDocument,
    deleteDocument
} from '../controllers/document.controller.js';
import { authMiddleware, requireAdmin } from '../../../core/auth/auth.middleware.js';
import { requireHrmsEmployee } from '../middleware/hrmsAuth.middleware.js';

const router = express.Router();

// EMPLOYEE: View own documents
router.get('/me', authMiddleware, requireHrmsEmployee, getMyDocuments);

// ADMIN: Document management
router.get('/employee/:employeeId', authMiddleware, requireAdmin, getEmployeeDocuments);
router.post('/', authMiddleware, requireAdmin, uploadDocument);
router.delete('/:id', authMiddleware, requireAdmin, deleteDocument);

export default router;
