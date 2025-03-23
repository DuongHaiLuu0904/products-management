const express = require('express')
const router = express.Router()

const multer = require('multer')
const upload = multer()

const controller = require('../../controllers/admin/account.controller')
const validate = require('../../validates/admin/account.validate')
const uploadCloud = require('../../middlewares/admin/uploadCloud.middleware')

router.get('/', controller.index)

router.get('/create', controller.create)

router.post('/create', upload.single('avatar'), uploadCloud.upload,validate.createPost, controller.createPost)

router.get('/edit/:id', controller.edit)

router.patch('/edit/:id', upload.single('thumbnail'), uploadCloud.upload, validate.createPatch, controller.editPatch)

router.delete("/delete/:id", controller.deleteItem)

router.patch('/change-status/:status/:id', controller.changeStatus)

router.get('/detail/:id', controller.detail)

module.exports = router