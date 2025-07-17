import { Router } from 'express'
const router = Router()

import { index, orderPost, success } from '../../controllers/clients/checkout.controller.js'
import { reuireAuth } from '../../middlewares/client/auth.middleware.js'

router.get('/', reuireAuth, index)

router.post('/order', reuireAuth, orderPost)

router.get('/success/:id', reuireAuth, success)

export default router