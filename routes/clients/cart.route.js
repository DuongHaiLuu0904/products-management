import { Router } from 'express'
const router = Router()

import * as controller from '../../controllers/clients/cart.controller.js'
import { requireAuth } from '../../middlewares/client/auth.middleware.js'
import { 
    validateCartIndex,
    validateCartAdd,
    validateCartDelete,
    validateCartUpdate
} from '../../validates/client/cart.validate.js'

router.get('/', requireAuth, validateCartIndex, controller.index)

router.post('/add/:productId', requireAuth, validateCartAdd, controller.addPost)

router.get('/delete/:id', requireAuth, validateCartDelete, controller.deleteProduct)

router.get('/update/:id/:quantity', requireAuth, validateCartUpdate, controller.update)

export default router