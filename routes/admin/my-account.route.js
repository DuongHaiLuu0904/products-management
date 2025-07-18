import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import * as controller from '../../controllers/admin/my-account.controller.js'
import { upload as uploadCloud } from '../../middlewares/admin/uploadCloud.middleware.js'
import { editPatch as validateEditPatch } from '../../validates/admin/my-account.validate.js'

router.get('/', controller.index)

router.get('/edit', controller.edit)

router.patch('/edit', upload.single('avatar'), uploadCloud, validateEditPatch, controller.editPatch)

export default router