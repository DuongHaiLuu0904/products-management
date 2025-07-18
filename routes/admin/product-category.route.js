import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import * as categoryValidate from '../../validates/admin/product-category.validate.js'
import { upload as uploadCloud } from '../../middlewares/admin/uploadCloud.middleware.js'
import * as controller from '../../controllers/admin/product-category.controller.js'


router.get('/', controller.index)

router.patch("/change-status/:status/:id", categoryValidate.validateChangeStatus, controller.changeStatus)

router.patch("/change-multi", categoryValidate.validateChangeMulti, controller.changeMulti)

router.delete("/delete/:id", categoryValidate.validateDelete, controller.deleteItem)

router.get('/create', controller.create)

router.post('/create', upload.single('thumbnail'), uploadCloud, categoryValidate.createPost, controller.createPost)

router.get('/edit/:id', controller.edit)

router.patch('/edit/:id', upload.single('thumbnail'), uploadCloud, categoryValidate.editPATCH, controller.editPATCH)

router.get('/detail/:id', controller.detail)

export default router