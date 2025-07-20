import express from 'express'
const router = express.Router()

import * as controller from '../../controllers/clients/product.controller.js'
import { requireAuth } from '../../middlewares/client/auth.middleware.js'
import * as productValidate from '../../validates/client/product.validate.js'

// Apply security headers to all routes
router.use(productValidate.setSecurityHeaders)

router.get('/', productValidate.validateQueryParams, controller.index)

router.get('/detail/:slugProduct', productValidate.validateProductSlug, controller.detail)

router.get('/:slugCategory', productValidate.validateCategorySlug, productValidate.validateQueryParams, controller.category)

// Comment routes
router.post('/comment/add', requireAuth, productValidate.validateCommentRateLimit, productValidate.validateAddComment, controller.addComment)

router.patch('/comment/edit/:commentId', requireAuth, productValidate.validateEditComment, controller.editComment)

router.delete('/comment/delete/:commentId', requireAuth, productValidate.validateDeleteComment, controller.deleteComment)

export default router