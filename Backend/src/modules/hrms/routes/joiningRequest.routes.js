import express from 'express';
import {
    submitJoiningRequest,
    checkRequestStatus,
    getAllJoiningRequests,
    getJoiningRequestById,
    approveJoiningRequest,
    rejectJoiningRequest,
    requestMoreInfo
} from '../controllers/joiningRequest.controller.js';
import { authMiddleware, requireAdmin } from '../../../core/auth/auth.middleware.js';

const router = express.Router();

// PUBLIC routes (no auth required) — for employee self-registration
router.post('/register', submitJoiningRequest);
router.get('/status', checkRequestStatus);

// ADMIN routes — for managing joining requests from ECS
router.get('/', authMiddleware, requireAdmin, getAllJoiningRequests);
router.get('/:id', authMiddleware, requireAdmin, getJoiningRequestById);
router.post('/:id/approve', authMiddleware, requireAdmin, approveJoiningRequest);
router.post('/:id/reject', authMiddleware, requireAdmin, rejectJoiningRequest);
router.post('/:id/request-info', authMiddleware, requireAdmin, requestMoreInfo);

export default router;
