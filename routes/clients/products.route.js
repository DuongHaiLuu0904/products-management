const express = require('express')
const router = express.Router()
const controller = require('../../controllers/clients/product.controller')
const authMiddleware = require('../../middlewares/client/auth.middleware')

router.get('/', controller.index)

router.get('/detail/:slugProduct', controller.detail)

// Comment routes
router.post('/comment/add', authMiddleware.reuireAuth, controller.addComment)

router.patch('/comment/edit/:commentId', authMiddleware.reuireAuth, controller.editComment)

router.delete('/comment/delete/:commentId', authMiddleware.reuireAuth, controller.deleteComment)

router.get('/:slugCategory', controller.category)

module.exports = router