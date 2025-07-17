import { Router } from 'express'
const router = Router()

import { notFriend, request, accept } from '../../controllers/clients/users.controller.js'

router.get('/not-friend', notFriend)

router.get('/request', request)

router.get('/accept', accept)

export default router