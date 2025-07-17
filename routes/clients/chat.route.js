import { Router } from 'express'
const router = Router()

import { index } from '../../controllers/clients/chat.controller.js'

router.get('/', index)

export default router