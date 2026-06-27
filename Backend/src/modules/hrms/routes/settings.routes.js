import express from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authMiddleware, requireAdmin, checkPermission } from '../../../core/auth/auth.middleware.js';

const router = express.Router();

// Only ECS Admins with HRMS permissions can view/edit settings
router.get('/', authMiddleware, requireAdmin, checkPermission('hrms::settings', 'view'), getSettings);
router.put('/', authMiddleware, requireAdmin, checkPermission('hrms::settings', 'edit'), updateSettings);

export default router;
