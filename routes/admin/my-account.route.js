import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import { index, edit, editPatch } from '../../controllers/admin/my-account.controller.js'
import { upload as _upload } from '../../middlewares/admin/uploadCloud.middleware.js'

router.get('/', index)

router.get('/edit', edit)

router.patch('/edit', upload.single('avatar'), _upload, editPatch)

export default router