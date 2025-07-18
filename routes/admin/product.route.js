import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import * as controller from '../../controllers/admin/product.controller.js'
import * as productValidate from '../../validates/admin/product.validate.js'
import { upload as uploadCloud } from '../../middlewares/admin/uploadCloud.middleware.js'

router.get('/', controller.index)

router.patch("/change-status/:status/:id", productValidate.validateChangeStatus, controller.changeStatus)

router.patch("/change-multi", productValidate.validateChangeMulti, controller.changeMulti)

router.delete("/delete/:id", productValidate.validateDelete, controller.deleteItem)

router.get('/create', controller.create)

router.post('/create', upload.single('thumbnail'), uploadCloud, productValidate.createPost, controller.createPost)

router.get('/edit/:id', controller.edit)

router.patch('/edit/:id', upload.single('thumbnail'), uploadCloud, productValidate.editPATCH, controller.editPATCH)

router.get('/detail/:id', controller.detail)

export default router