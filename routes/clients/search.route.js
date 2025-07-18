import { Router } from 'express'
const router = Router()

import { index } from '../../controllers/clients/search.controller.js'

router.get('/', index)

export default router