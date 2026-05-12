import express from 'express';
import authRoutes from '../core/auth/auth.routes.js';
import deliveryRoutes from '../modules/food/delivery/routes/delivery.routes.js';
import restaurantRoutes from '../modules/food/restaurant/routes/restaurant.routes.js';
import landingRoutes from '../modules/food/landing/routes/landing.routes.js';
import { getPublicDiningCategories, getPublicDiningRestaurants } from '../modules/food/dining/controllers/diningPublic.controller.js';
import uploadRoutes from '../modules/uploads/routes/upload.routes.js';
import restaurantAdminRoutes from '../modules/food/admin/routes/admin.routes.js';
import userRoutes from '../modules/food/user/routes/user.routes.js';
import orderUserRoutes from '../modules/food/orders/routes/order.routes.user.js';
import paymentRoutes from '../core/payments/payment.routes.js';
import fcmRoutes from '../core/notifications/fcm.routes.js';
import notificationRoutes from '../core/notifications/notification.routes.js';
import { authMiddleware } from '../core/auth/auth.middleware.js';

import { requireRoles } from '../core/roles/role.middleware.js';
import { getQueuesController } from '../controllers/admin.controller.js';
import { getPublicEnvController } from '../modules/food/landing/controllers/publicEnv.controller.js';
import quickCommerceRoutes from '../modules/quick-commerce/routes/quick-commerce.routes.js';
import webhookRoutes from '../core/payments/routes/webhook.routes.js';
import sellerRoutes from '../modules/quick-commerce/seller/routes/seller.routes.js';
import searchRoutes from '../modules/food/search/routes/search.routes.js';


import commonSettingsRoutes from '../modules/common/routes/settings.routes.js';
import { getGlobalSettings as getPublicSettings } from '../modules/common/controllers/settings.controller.js';

const router = express.Router();

router.get('/v1/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Server is healthy' });
});



// Food-prefixed auth routes (preferred)
router.use('/v1/food/auth', authRoutes);

// Backward-compatible auth routes (legacy)
router.use('/v1/auth', authRoutes);
router.use('/v1/food/delivery', deliveryRoutes);
router.use('/v1/food/restaurant', restaurantRoutes);
// Landing & hero-banners for Food user app (paths start with /food/hero-banners/...)
router.use('/v1/food', landingRoutes);
router.use('/v1/food/search', searchRoutes);
router.get('/v1/food/dining/categories/public', getPublicDiningCategories);
router.get('/v1/food/dining/restaurants/public', getPublicDiningRestaurants);
router.use('/v1/uploads', uploadRoutes);

// Mark business-settings/public as truly public (must be before protected admin block)
// Global Settings routes
router.use('/v1/common/settings', commonSettingsRoutes);

// Backward compatibility for public settings
router.get('/v1/food/admin/business-settings/public', getPublicSettings);

router.use('/v1/food/admin', authMiddleware, requireRoles('ADMIN'), restaurantAdminRoutes);
router.use('/v1/food/user', authMiddleware, requireRoles('USER'), userRoutes);
router.use('/v1/food/notifications', authMiddleware, requireRoles('USER', 'RESTAURANT', 'DELIVERY_PARTNER'), notificationRoutes);
router.use('/v1/food/orders', authMiddleware, requireRoles('USER'), orderUserRoutes);
router.use('/v1/food/payments', authMiddleware, paymentRoutes);
router.use('/v1/payments/webhook', webhookRoutes);
router.use('/v1/fcm-tokens', fcmRoutes);
router.use('/fcm-tokens', fcmRoutes);
router.use('/v1/quick-commerce', quickCommerceRoutes);
router.use('/v1/seller', sellerRoutes);


// router.get('/v1/env/public', getPublicEnvController);
// router.get('/env/public', getPublicEnvController);

router.get('/v1/admin/queues', authMiddleware, requireRoles('ADMIN'), getQueuesController);

export default router;
