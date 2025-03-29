const express = require('express')
const router = express.Router()

const controller = require('../../controllers/clients/cart.controller.js')

router.get('/', controller.index)

router.post('/add/:productId', controller.addPost)

router.get('/delete/:id', controller.delete)

router.get('/update/:id/:quantity', controller.update)

module.exports = router