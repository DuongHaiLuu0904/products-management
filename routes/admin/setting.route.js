import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import * as controller from '../../controllers/admin/setting.controller.js'
import { upload as uploadCloud } from '../../middlewares/admin/uploadCloud.middleware.js'
import * as settingValidate from '../../validates/admin/setting.validate.js'
import { commonValidationMiddleware } from '../../validates/admin/common.validate.js'

router.get('/general', commonValidationMiddleware, controller.general)

router.patch('/general', 
    commonValidationMiddleware,
    upload.single('logo'), 
    settingValidate.validateLogoUpload,
    settingValidate.validateGeneralSettings,
    uploadCloud,
    controller.generalPatch
)

export default router