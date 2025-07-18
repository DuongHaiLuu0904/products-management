import { Router } from 'express'
const router = Router()

import * as controller from '../../controllers/admin/auth.controller.js'
import * as authValidate from '../../validates/admin/auth.validate.js'

router.use(authValidate.validateRequest)
    
router.get('/login', controller.login)

router.post('/login', authValidate.loginPost, controller.loginPost)

router.get('/logout', controller.logout)

export default router