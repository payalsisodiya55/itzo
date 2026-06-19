import express from 'express';
import * as jobController from '../controllers/job.controller.js';
import { adminAuth } from '../../../../core/auth/middleware.js';
import { requireAdminPermission } from '../../../../middleware/requireAdminPermission.js';

const router = express.Router();

router.use(adminAuth);
router.use(requireAdminPermission(['staff_management', 'dashboard'])); // Just ensuring basic admin access or we could use specific permission like 'roles' or add a new 'careers'

router.post('/', jobController.createJobController);
router.get('/', jobController.getAllJobsController);
router.get('/:id', jobController.getJobByIdController);
router.put('/:id', jobController.updateJobController);
router.delete('/:id', jobController.deleteJobController);
router.patch('/:id/featured', jobController.toggleFeaturedController);
router.patch('/:id/status', jobController.updateStatusController);

export default router;
