import { Router } from 'express'
const router = Router()

import * as controller from '../../controllers/clients/chat.controller.js'

router.get('/', controller.index)

export default router