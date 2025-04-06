const Chat = require('../../models/chat.model')
const User = require('../../models/user.model')

const chatSocket = require('../../socket/client/chat.socket')

// [GET] /chat
exports.index = async (req, res) => {
    
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
    