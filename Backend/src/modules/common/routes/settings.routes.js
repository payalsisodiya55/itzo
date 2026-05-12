import express from 'express';
import * as settingsController from '../controllers/settings.controller.js';
import { upload } from '../../../middleware/upload.js';
import { authMiddleware } from '../../../core/auth/auth.middleware.js';
import { requireRoles } from '../../../core/roles/role.middleware.js';

const router = express.Router();

// Public endpoint for app logo/theme
router.get('/public', settingsController.getGlobalSettings);

// Protected admin endpoints
router.get('/', authMiddleware, requireRoles('ADMIN'), settingsController.getGlobalSettings);
router.patch('/', authMiddleware, requireRoles('ADMIN'), upload.fields([
    { name: 'adminLogo', maxCount: 1 },
    { name: 'adminFavicon', maxCount: 1 },
    { name: 'userLogo', maxCount: 1 },
    { name: 'userFavicon', maxCount: 1 },
    { name: 'deliveryLogo', maxCount: 1 },
    { name: 'deliveryFavicon', maxCount: 1 },
    { name: 'restaurantLogo', maxCount: 1 },
    { name: 'restaurantFavicon', maxCount: 1 },
    { name: 'sellerLogo', maxCount: 1 },
    { name: 'sellerFavicon', maxCount: 1 }
]), settingsController.updateGlobalSettings);

export default router;
