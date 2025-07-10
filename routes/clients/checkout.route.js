const express = require('express')
const router = express.Router()

const controller = require('../../controllers/clients/checkout.controller.js')
const authMiddleware = require('../../middlewares/client/auth.middleware.js')

router.get('/', authMiddleware.reuireAuth, controller.index)

router.post('/order', authMiddleware.reuireAuth, controller.orderPost)

router.get('/success/:id', authMiddleware.reuireAuth, controller.success)

module.exports = router