import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import * as controller from '../../controllers/admin/user.controller.js'
import * as userValidate from '../../validates/admin/user.validate.js'
import { upload as uploadCloud } from '../../middlewares/admin/uploadCloud.middleware.js'


router.get('/', controller.index)

router.get('/create', controller.create)

router.post('/create', upload.single('avatar'), uploadCloud, userValidate.createPost, controller.createPost)

router.get('/edit/:id', userValidate.validateDetail, controller.edit)

router.patch('/edit/:id', upload.single('avatar'), uploadCloud, userValidate.editPatch, controller.editPatch)

router.patch('/change-status/:status/:id', userValidate.validateChangeStatus, controller.changeStatus)

router.delete("/delete/:id", userValidate.validateDelete, controller.deleteItem)

router.get('/detail/:id', userValidate.validateDetail, controller.detail)

export default router