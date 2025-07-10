const express = require('express')
const router = express.Router()

const controller = require('../../controllers/clients/cart.controller.js')
const authMiddleware = require('../../middlewares/client/auth.middleware.js')

router.get('/', authMiddleware.reuireAuth, controller.index)

router.post('/add/:productId', authMiddleware.reuireAuth, controller.addPost)

router.get('/delete/:id', authMiddleware.reuireAuth, controller.delete)

router.get('/update/:id/:quantity', authMiddleware.reuireAuth, controller.update)

module.exports = router