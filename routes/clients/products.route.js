import express from 'express'
import * as controller from '../../controllers/clients/product.controller.js'
import * as authMiddleware from '../../middlewares/client/auth.middleware.js'

const router = express.Router()

router.get('/', controller.index)

router.get('/detail/:slugProduct', controller.detail)

// Comment routes
router.post('/comment/add', authMiddleware.reuireAuth, controller.addComment)

router.patch('/comment/edit/:commentId', authMiddleware.reuireAuth, controller.editComment)

router.delete('/comment/delete/:commentId', authMiddleware.reuireAuth, controller.deleteComment)

router.get('/:slugCategory', controller.category)

export default router