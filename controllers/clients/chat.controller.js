import Chat from '../../models/chat.model.js'
import User from '../../models/user.model.js'
import RoomChat from '../../models/room-chat.model.js'

import chatSocket from '../../socket/client/chat.socket.js'

// [GET] /chat
export async function index(req, res) {
    
    chatSocket(res)

    const userId = res.locals.user.id
    const user = await User.findById(userId)
    
    // Lấy danh sách phòng chat của user
    const rooms = await RoomChat.find({
        "users.user_id": userId,
        typeRoom: "friend",
        deleted: false
    })

    // Lấy thông tin bạn bè cho mỗi room
    for(const room of rooms) {
        const friendInfo = room.users.find(user => user.user_id != userId)
        if(friendInfo) {
            const friend = await User.findById(friendInfo.user_id).select('fullName avatar')
            room.friend = friend
        }
    }

    res.render('client/pages/chat/index', {
        title: 'Chat',
        rooms: rooms
    })
}

// [GET] /users/not-friend
export async function notFriend(req, res) {
    chatSocket(res)

    const userId = res.locals.user.id
    const myUser = await User.findOne({ _id: userId })

    const requestFriend = myUser.requestFriend
    const acceptFriend = myUser.acceptFriend

    const users = await User.find({
        $and: [
            { _id: { $ne: userId } },
            { _id: { $nin: requestFriend } },
            { _id: { $nin: acceptFriend } }
        ],
        status: 'active',
        deleted: false
    }).select('fullName avatar')

    res.render('client/pages/chat/not-friend', {
        title: 'Danh sách người dùng',
        users: users
    })
}

// [GET] /users/request
export async function request(req, res) {
    chatSocket(res)

    const userId = res.locals.user.id
    const myUser = await User.findOne({ _id: userId })

    const requestFriend = myUser.requestFriend

    const users = await User.find({
        _id: { $in: requestFriend },
        status: 'active',
        deleted: false
    }).select('id fullName avatar')

    res.render('client/pages/chat/request', {
        title: 'Lời mời đã gửi',
        users: users
    })
}

// [GET] /users/accept
export async function accept(req, res) {
    try {
        chatSocket(res)

        const userId = res.locals.user.id
        const myUser = await User.findOne({ _id: userId })

        if (!myUser) {
            req.flash("error", "Người dùng không tồn tại!")
            return res.redirect("/chat")
        }

        const acceptFriend = myUser.acceptFriend || []

        const users = await User.find({
            _id: { $in: acceptFriend },
            status: 'active',
            deleted: false
        }).select('id fullName avatar')

        res.render('client/pages/chat/accept', {
            title: 'Lời mời đã nhận',
            users: users
        })
    } catch (error) {
        console.error('Error in accept function:', error)
        req.flash("error", "Có lỗi xảy ra!")
        res.redirect("/chat")
    }
}

// [GET] /users/friends
export async function friends(req, res) {
    chatSocket(res)

    const userId = res.locals.user.id
    const myUser = await User.findOne({ _id: userId })

    const friendList = myUser.friendList
    const friendIds = friendList.map(item => item.user_id)

    const users = await User.find({
        _id: { $in: friendIds },
        status: 'active',
        deleted: false
    }).select('id fullName avatar')

    res.render('client/pages/chat/friends', {
        title: 'Danh sách bạn bè',
        users: users
    })
}

// [GET] /chat/:roomChatId
export async function chatDetail(req, res) {
    try {
        chatSocket(res)

        const userId = res.locals.user.id
        const roomChatId = req.params.roomChatId

        // Kiểm tra quyền truy cập room
        const room = await RoomChat.findOne({
            _id: roomChatId,
            "users.user_id": userId,
            deleted: false
        })

        if(!room) {
            req.flash("error", "Không có quyền truy cập phòng chat này!")
            return res.redirect("/chat")
        }

        // Lấy thông tin user khác trong room (với typeRoom = "friend")
        const friendInfo = room.users.find(user => user.user_id != userId)
        const friend = await User.findById(friendInfo.user_id).select('fullName avatar')

        // Lấy tin nhắn trong room
        const chats = await Chat.find({
            room_chat_id: roomChatId,
            deleted: false
        }).sort({ createdAt: 1 })

        for(const chat of chats) {
            const user = await User.findById(chat.user_id).select('fullName avatar')
            chat.user = user
        }

        res.render('client/pages/chat/detail', {
            title: `Chat với ${friend.fullName}`,
            chats: chats,
            roomChatId: roomChatId,
            friend: friend
        })

    } catch (error) {
        req.flash("error", "Lỗi!")
        res.redirect("/chat")
    }
}
