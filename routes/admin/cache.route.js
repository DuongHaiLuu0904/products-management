import { Router } from 'express';
import * as controller from '../../controllers/admin/cache.controller.js';
import { reuireAuth } from '../../middlewares/admin/auth.middleware.js';

const router = Router();

// Apply auth middleware to all routes
router.use(reuireAuth);

router.get('/', controller.index);

router.post('/cleanup', controller.cleanup);

router.get('/stats', controller.stats);

router.post('/invalidate', controller.invalidate);

router.post('/refresh', controller.refresh);

export default router;
