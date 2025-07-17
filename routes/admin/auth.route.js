import { Router } from 'express'
const router = Router()

import { login, loginPost, logout } from '../../controllers/admin/auth.controller.js'
import { loginPost as _loginPost } from '../../validates/admin/auth.validate.js'

router.get('/login', login)

router.post('/login',_loginPost, loginPost)

router.get('/logout', logout)

export default router