import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import { general, generalPatch } from '../../controllers/admin/setting.controller.js'
import { upload as _upload } from '../../middlewares/admin/uploadCloud.middleware.js'

router.get('/general', general)

router.patch('/general', upload.single('logo'), _upload, generalPatch)

export default router