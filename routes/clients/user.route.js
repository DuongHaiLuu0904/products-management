import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import * as controller from '../../controllers/clients/user.controller.js'
import * as userValidate from '../../validates/client/user.validate.js'
import { requireAuth } from '../../middlewares/client/auth.middleware.js'
import { upload as _upload } from '../../middlewares/client/uploadCloud.middleware.js'
import { commonValidationMiddleware } from '../../validates/client/common.validate.js'

router.get('/register', controller.register)

router.post('/register', commonValidationMiddleware, userValidate.registerPost, controller.registerPost)

router.get('/login', controller.login)

router.post('/login', commonValidationMiddleware, userValidate.loginPost, controller.loginPost)

router.get('/logout', controller.logout)

// Google OAuth
router.get('/auth/google', controller.googleAuth)

router.get('/auth/google/callback', controller.googleCallback)

// GitHub OAuth
router.get('/auth/github', controller.githubAuth)

router.get('/auth/github/callback', controller.githubCallback)

router.get('/password/forgot', controller.forgotPassword)

router.post('/password/forgot', commonValidationMiddleware, userValidate.forgotPasswordPost, controller.forgotPasswordPost)

router.get('/password/otp', userValidate.otpPassword, controller.otpPassword)

router.post('/password/otp', commonValidationMiddleware, userValidate.otpPasswordPost, controller.otpPasswordPost)

router.get('/password/reset', userValidate.resetPassword, controller.resetPassword)

router.post('/password/reset', commonValidationMiddleware, userValidate.resetPasswordPost, controller.resetPasswordPost)

router.get('/info', requireAuth, controller.info)

router.get('/edit', requireAuth, controller.edit)

router.post('/edit', requireAuth, commonValidationMiddleware, upload.single('avatar'), userValidate.validateAvatarUpload, userValidate.editPost, _upload, controller.editPost)

router.get('/change-password', requireAuth, controller.changePassword)

router.post('/change-password', requireAuth, commonValidationMiddleware, userValidate.changePasswordPost, controller.changePasswordPost)

router.post('/change-password', requireAuth, userValidate._changePasswordPost, controller.changePasswordPost)

export default router