import { Router } from 'express'
const router = Router()

import * as controller from '../../controllers/admin/dashboard.controller.js'

router.get('/', controller.dashboard)

router.get('/statistics', controller.getStatistics)

export default router