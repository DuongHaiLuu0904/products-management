import { Router } from 'express'
const router = Router()

import * as controller from '../../controllers/clients/checkout.controller.js'
import { requireAuth } from '../../middlewares/client/auth.middleware.js'
import { checkoutValidationMiddleware, successValidationMiddleware } from '../../validates/client/checkout.validate.js'

router.get('/', requireAuth, controller.index)

router.post('/order', requireAuth, checkoutValidationMiddleware, controller.orderPost)

router.get('/success/:id', requireAuth, successValidationMiddleware, controller.success)

export default router