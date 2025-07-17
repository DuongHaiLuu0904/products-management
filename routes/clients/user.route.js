import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import { register, registerPost, login, loginPost, logout, googleAuth, googleCallback, githubAuth, githubCallback, forgotPassword, forgotPasswordPost, otpPassword, otpPasswordPost, resetPassword, resetPasswordPost, info, edit, editPost, changePassword, changePasswordPost } from '../../controllers/clients/user.controller.js'
import { registerPost as _registerPost, loginPost as _loginPost, resetPasswordPost as _resetPasswordPost, editPost as _editPost, changePasswordPost as _changePasswordPost } from '../../validates/client/user.validate.js'
import { reuireAuth } from '../../middlewares/client/auth.middleware.js'
import { upload as _upload } from '../../middlewares/client/uploadCloud.middleware.js'

router.get('/register', register)

router.post('/register', _registerPost, registerPost)

router.get('/login', login)

router.post('/login', _loginPost, loginPost)

router.get('/logout', logout)

// Google OAuth
router.get('/auth/google', googleAuth)

router.get('/auth/google/callback', googleCallback)

// GitHub OAuth
router.get('/auth/github', githubAuth)

router.get('/auth/github/callback', githubCallback)

router.get('/password/forgot', forgotPassword)

router.post('/password/forgot', forgotPasswordPost)

router.get('/password/otp', otpPassword)

router.post('/password/otp', otpPasswordPost)

router.get('/password/reset', resetPassword)

router.post('/password/reset', _resetPasswordPost, resetPasswordPost)

router.get('/info', reuireAuth, info)

router.get('/edit', reuireAuth, edit)

router.post('/edit', reuireAuth, upload.single('avatar'), _upload, _editPost, editPost)

router.get('/change-password', reuireAuth, changePassword)

router.post('/change-password', reuireAuth, _changePasswordPost, changePasswordPost)

export default router