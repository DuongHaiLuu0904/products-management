const express = require('express')
const router = express.Router()

const multer  = require('multer')
// const storageMulter = require('../../helpers/storageMulter')

const upload = multer()

const controller = require('../../controllers/admin/product.controller')
const validate = require('../../validates/admin/product.validate')
const uploadCloud = require('../../middlewares/admin/uploadCloud.middleware')

router.get('/', controller.index)

router.patch("/change-status/:status/:id", controller.changeStatus)

router.patch("/change-multi", controller.changeMulti)

router.delete("/delete/:id", controller.deleteItem)

router.get('/create', controller.create)

router.post(
    '/create', 
    upload.single('thumbnail'), 
    uploadCloud.upload,
    validate.createPost, 
    controller.createPost)

router.get('/edit/:id', controller.edit)

router.patch('/edit/:id', upload.single('thumbnail'), validate.createPost, controller.editPATCH)

router.get('/detail/:id', controller.detail)


module.exports = router