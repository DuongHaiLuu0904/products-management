import Chat from '../../models/chat.model.js'
import User from '../../models/user.model.js'
import RoomChat from '../../models/room-chat.model.js'

/**
 * Helper function to get unique rooms and cleanup duplicates
 */
async function getUniqueRoomsForUser(userId) {
    // Lấy danh sách phòng chat của user
    let rooms = await RoomChat.find({
        "users.user_id": userId,
        typeRoom: "friend",
        deleted: false
    }).sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo (mới nhất trước)

    // Loại bỏ duplicate rooms (rooms có cùng friend)
    const uniqueRooms = []
    const seenFriends = new Set()
    const duplicateRoomIds = []

    for(const room of rooms) {
        const friendInfo = room.users.find(user => user.user_id != userId)
        if(friendInfo && !seenFriends.has(friendInfo.user_id)) {
            seenFriends.add(friendInfo.user_id)
            const friend = await User.findById(friendInfo.user_id).select('fullName avatar')
            room.friend = friend
            uniqueRooms.push(room)
        } else if(friendInfo && seenFriends.has(friendInfo.user_id)) {
            // Đánh dấu room trùng lặp để xóa (giữ lại room mới nhất)
            duplicateRoomIds.push(room._id)
        }
    }

    // Xóa các room trùng lặp trong background
    if(duplicateRoomIds.length > 0) {
        RoomChat.updateMany(
            { _id: { $in: duplicateRoomIds } },
            { 
                deleted: true,
                deletedAt: new Date()
            }
        ).catch(err => {
            console.error('Error deleting duplicate rooms:', err)
        })
        
        console.log(`🧹 Đã xóa ${duplicateRoomIds.length} room trùng lặp cho user ${userId}`)
    }

    return uniqueRooms
}

// [GET] /chat
export async function index(req, res) {
    const userId = res.locals.user.id
    
    // Sử dụng helper function để lấy unique rooms và cleanup duplicates
    const uniqueRooms = await getUniqueRoomsForUser(userId)

    res.render('client/pages/chat/index', {
        title: 'Chat',
        rooms: uniqueRooms
    })
}

// [GET] /users/not-friend
export async function notFriend(req, res) {
    const userId = res.locals.user.id
    const myUser = await User.findOne({ _id: userId })

    const requestFriend = myUser.requestFriend
    const acceptFriend = myUser.acceptFriend
    const friendList = myUser.friendList.map(item => item.user_id)

    const users = await User.find({
        $and: [
            { _id: { $ne: userId } },
            { _id: { $nin: requestFriend } },
            { _id: { $nin: acceptFriend } },
            { _id: { $nin: friendList } }
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
            
            // Xử lý dữ liệu images - đảm bảo chỉ là URL string
            if(chat.images && chat.images.length > 0) {
                chat.images = chat.images.map(image => {
                    // Nếu image là object (dữ liệu cũ), lấy URL
                    if(typeof image === 'object' && image.url) {
                        return image.url
                    }
                    // Nếu đã là string URL thì giữ nguyên
                    return image
                })
            }
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
