import Chat from '../../models/chat.model.js'
import User from '../../models/user.model.js'

import chatSocket from '../../socket/client/chat.socket.js'

// [GET] /chat
export async function index(req, res) {
    
    chatSocket(res)

    const chats = await Chat.find({ deleted: false })  

    for(const chat of chats) {
        const user = await User.findById(chat.user_id).select('fullName')
        chat.user = user
    }

    res.render('client/pages/chat/index', {
        title: 'Chat',
        chats: chats
    })
}
    