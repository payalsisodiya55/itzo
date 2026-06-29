import express from 'express';
import { getSettings, updateSettings, updateSettingsSection } from '../controllers/settings.controller.js';
import { authMiddleware, requireAdmin } from '../../../core/auth/auth.middleware.js';

const router = express.Router();

// GET: Accessible by any authenticated user (settings needed for frontend calculations)
router.get('/', authMiddleware, getSettings);

// PUT: Admin-only — update entire settings
router.put('/', authMiddleware, requireAdmin, updateSettings);

// PATCH: Admin-only — update a specific section
router.patch('/:section', authMiddleware, requireAdmin, updateSettingsSection);

export default router;
