import { Router } from 'express'
const router = Router()

import { index } from '../../controllers/clients/home.controller.js'

router.get('/', index)

export default router