import { Router } from 'express';
const router = Router();

import { refreshToken, checkStatus } from '../../controllers/admin/token.controller.js';

router.post('/refresh', refreshToken);

router.get('/status', checkStatus);

export default router;
