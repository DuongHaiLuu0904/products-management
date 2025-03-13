const express = require('express')
const router = express.Router()
const controller = require('../../controllers/clients/product.controller')

router.get('/', controller.index)

router.get('/:slug', controller.detail)

module.exports = router