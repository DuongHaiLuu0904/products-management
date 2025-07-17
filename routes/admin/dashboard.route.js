import { Router } from 'express'
const router = Router()

import { dashboard, getStatistics } from '../../controllers/admin/dashboard.controller.js'

router.get('/', dashboard)

router.get('/statistics', getStatistics)

export default router