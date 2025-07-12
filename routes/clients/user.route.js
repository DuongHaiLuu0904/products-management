const express = require('express')
const router = express.Router()

const controller = require('../../controllers/clients/user.controller.js')
const validate = require('../../validates/client/user.validate.js')
const authMiddleware = require('../../middlewares/client/auth.middleware.js')

router.get('/register', controller.register)

router.post('/register', validate.registerPost, controller.registerPost)

router.get('/login', controller.login)

router.post('/login', validate.loginPost, controller.loginPost)

router.get('/logout', controller.logout)

// Google OAuth
router.get('/auth/google', controller.googleAuth)

router.get('/auth/google/callback', controller.googleCallback)

// GitHub OAuth
router.get('/auth/github', controller.githubAuth)

router.get('/auth/github/callback', controller.githubCallback)

router.get('/password/forgot', controller.forgotPassword)

router.post('/password/forgot', controller.forgotPasswordPost)

router.get('/password/otp', controller.otpPassword)

router.post('/password/otp', controller.otpPasswordPost)

router.get('/password/reset', controller.resetPassword)

router.post('/password/reset', validate.resetPasswordPost, controller.resetPasswordPost)

router.get('/info', authMiddleware.reuireAuth, controller.info)

router.get('/edit', authMiddleware.reuireAuth, controller.edit)

router.post('/edit', authMiddleware.reuireAuth, validate.editPost, controller.editPost)

router.get('/change-password', authMiddleware.reuireAuth, controller.changePassword)

router.post('/change-password', authMiddleware.reuireAuth, validate.changePasswordPost, controller.changePasswordPost)

module.exports = router