import { Router } from 'express'
const router = Router()

import { index, addPost, deleteProduct, update } from '../../controllers/clients/cart.controller.js'
import { reuireAuth } from '../../middlewares/client/auth.middleware.js'

router.get('/', reuireAuth, index)

router.post('/add/:productId', reuireAuth, addPost)

router.get('/delete/:id', reuireAuth, deleteProduct)

router.get('/update/:id/:quantity', reuireAuth, update)

export default router