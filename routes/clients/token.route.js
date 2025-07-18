import { Router } from 'express';
const router = Router();

import * as controller from '../../controllers/clients/token.controller.js';

router.post('/refresh', controller.refreshToken);
router.get('/status', controller.checkStatus);

export default router;
