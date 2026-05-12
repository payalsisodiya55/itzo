import express from 'express';
import { searchController, listAdminCategoriesController } from '../controllers/search.controller.js';

const router = express.Router();

/**
 * Unified Search Endpoint
 * GET /api/v1/food/search/unified
 */
router.get('/unified', searchController);

/**
 * Admin Categories Only Endpoint (to avoid restaurant-created ones as requested)
 * GET /api/v1/food/search/categories/admin
 */
router.get('/categories/admin', listAdminCategoriesController);

export default router;
