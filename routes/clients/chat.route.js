import { Router } from 'express'
const router = Router()

import * as controller from '../../controllers/clients/chat.controller.js'

// GET routes for rendering views
router.get('/', controller.index)

router.get('/not-friend', controller.notFriend)

router.get('/request', controller.request)

router.get('/accept', controller.accept)

router.get('/friends', controller.friends)

router.get('/:roomChatId', controller.chatDetail)

// All friend management actions (add, accept, refuse, cancel, delete) 
// are now handled via Socket.io realtime events in chat.socket.js

export default router