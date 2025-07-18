import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import * as controller from '../../controllers/admin/account.controller.js'
import * as accountValidate from '../../validates/admin/account.validate.js'
import { upload as uploadCloud } from '../../middlewares/admin/uploadCloud.middleware.js'

router.get('/', accountValidate.validateIndex, controller.index)

router.get('/create', accountValidate.validateCreate, controller.create)

router.post('/create', upload.single('avatar'), accountValidate.validateFileUpload, uploadCloud, accountValidate.validateCreatePost, controller.createPost)

router.get('/edit/:id', accountValidate.validateEdit, controller.edit)

router.patch('/edit/:id', upload.single('avatar'), accountValidate.validateFileUpload, uploadCloud, accountValidate.validateEditPatch, controller.editPatch)

router.delete("/delete/:id", accountValidate.validateDelete, controller.deleteItem)

router.patch('/change-status/:status/:id', accountValidate.validateChangeStatus, controller.changeStatus)

router.get('/detail/:id', accountValidate.validateDetail, controller.detail)

export default router