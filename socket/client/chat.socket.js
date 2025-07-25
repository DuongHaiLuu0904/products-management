import Chat from '../../models/chat.model.js'
import RoomChat from '../../models/room-chat.model.js'
import User from '../../models/user.model.js'
import { uploadToCloudinary } from '../../helpers/uploadToCloudinary.js'

// Track if socket handlers are already set up
let socketHandlersInitialized = false

export default async () => {
    // Only initialize socket handlers once
    if (socketHandlersInitialized) {
        return
    }
    
    socketHandlersInitialized = true

    _io.on('connection', (socket) => {
        
        // Join room khi user vào chat detail
        socket.on('CLIENT_JOIN_ROOM', (roomChatId) => {
            socket.join(roomChatId)
        })

        // Leave room khi user rời khỏi chat
        socket.on('CLIENT_LEAVE_ROOM', (roomChatId) => {
            socket.leave(roomChatId)
        })

        socket.on('Client_Send_Message', async (data) => {
            const roomChatId = data.roomChatId
            const userId = data.userId
            const fullName = data.fullName
            
            if (!userId || !fullName) {
                socket.emit('error', { message: 'User information missing' })
                return
            }
            
            // Kiểm tra quyền gửi tin nhắn trong room
            const room = await RoomChat.findOne({
                _id: roomChatId,
                "users.user_id": userId,
                deleted: false
            })

            if(!room) {
                return
            }
            
            let images = []
            for(const image of data.images) {
                const link = await uploadToCloudinary(image)
                images.push(link.url)  // Chỉ lưu URL thay vì toàn bộ object
            }
            
            const chat = new Chat({
                user_id: userId,
                room_chat_id: roomChatId,
                content: data.content,
                images: images
            })
            await chat.save()

            _io.to(roomChatId).emit('Server_Return_Message', {
                userId: userId,
                fullName: fullName,
                content: data.content,
                images: images
            })
        })

        socket.on('Client_Send_Typing', (data) => {
            const roomChatId = data.roomChatId
            const userId = data.userId
            const fullName = data.fullName
            
            if (!userId || !fullName) {
                return
            }
            
            socket.to(roomChatId).emit('Server_Return_Typing', {
                userId: userId,
                fullName: fullName,
                type: data.type
            })
        })

        // Realtime Friend Management Events

        // Gửi lời mời kết bạn
        socket.on('CLIENT_ADD_FRIEND', async (data) => {
            try {
                const userBId = data.userBId
                const userId = data.userId
                const fullName = data.fullName
                
                if (!userId || !fullName) {
                    socket.emit('SERVER_ADD_FRIEND_ERROR', {
                        code: 400,
                        message: 'User information missing!'
                    })
                    return
                }

                const existUserB = await User.findOne({
                    _id: userBId,
                    status: 'active',
                    deleted: false
                })

                if(existUserB) {
                    const existUserAInB = existUserB.acceptFriend.find(item => item == userId)

                    if(!existUserAInB) {
                        await User.updateOne(
                            { _id: userBId },
                            {
                                $push: { acceptFriend: userId }
                            }
                        )
                    }

                    const existUserBInA = await User.findOne({
                        _id: userId,
                        requestFriend: userBId
                    })

                    if(!existUserBInA) {
                        await User.updateOne(
                            { _id: userId },
                            {
                                $push: { requestFriend: userBId }
                            }
                        )
                    }

                    // Emit to sender
                    socket.emit('SERVER_ADD_FRIEND_SUCCESS', {
                        code: 200,
                        message: 'Gửi yêu cầu kết bạn thành công!',
                        userBId: userBId
                    })

                    // Emit to receiver để update realtime
                    socket.broadcast.emit('SERVER_RECEIVE_FRIEND_REQUEST', {
                        userAId: userId,
                        userAName: fullName
                    })

                } else {
                    socket.emit('SERVER_ADD_FRIEND_ERROR', {
                        code: 400,
                        message: 'Người dùng không tồn tại!'
                    })
                }
            } catch (error) {
                socket.emit('SERVER_ADD_FRIEND_ERROR', {
                    code: 400,
                    message: 'Lỗi!'
                })
            }
        })

        // Chấp nhận kết bạn
        socket.on('CLIENT_ACCEPT_FRIEND', async (data) => {
            try {
                const userBId = data.userBId
                const userId = data.userId
                const fullName = data.fullName
                
                if (!userId || !fullName) {
                    socket.emit('SERVER_ACCEPT_FRIEND_ERROR', {
                        code: 400,
                        message: 'User information missing!'
                    })
                    return
                }

                const existUserB = await User.findOne({
                    _id: userBId,
                    status: 'active',
                    deleted: false
                })

                if(existUserB) {
                    // Kiểm tra xem đã có room chat giữa 2 người này chưa
                    let existingRoom = await RoomChat.findOne({
                        typeRoom: "friend",
                        "users.user_id": { $all: [userId, userBId] },
                        deleted: false
                    })

                    let roomChatId;

                    if(existingRoom) {
                        // Nếu đã có room chat, sử dụng room đó
                        roomChatId = existingRoom._id
                        console.log('Sử dụng room chat đã tồn tại:', roomChatId)
                    } else {
                        // Nếu chưa có, tạo room chat mới
                        const roomChat = new RoomChat({
                            typeRoom: "friend",
                            users: [
                                {
                                    user_id: userId,
                                    role: "superAdmin"
                                },
                                {
                                    user_id: userBId,
                                    role: "superAdmin"
                                }
                            ]
                        })

                        await roomChat.save()
                        roomChatId = roomChat._id
                        console.log('Tạo room chat mới:', roomChatId)
                    }

                    // Kiểm tra xem người dùng đã có trong friendList chưa
                    const userA = await User.findById(userId)
                    const userB = await User.findById(userBId)

                    const friendExistInA = userA.friendList.some(friend => friend.user_id === userBId)
                    const friendExistInB = userB.friendList.some(friend => friend.user_id === userId)

                    // Cập nhật friendList cho user A nếu chưa có
                    if(!friendExistInA) {
                        await User.updateOne(
                            { _id: userId },
                            {
                                $push: {
                                    friendList: {
                                        user_id: userBId,
                                        room_chat_id: roomChatId
                                    }
                                },
                                $pull: { acceptFriend: userBId }
                            }
                        )
                    } else {
                        // Chỉ xóa khỏi acceptFriend nếu đã có trong friendList
                        await User.updateOne(
                            { _id: userId },
                            { $pull: { acceptFriend: userBId } }
                        )
                    }

                    // Cập nhật friendList cho user B nếu chưa có
                    if(!friendExistInB) {
                        await User.updateOne(
                            { _id: userBId },
                            {
                                $push: {
                                    friendList: {
                                        user_id: userId,
                                        room_chat_id: roomChatId
                                    }
                                },
                                $pull: { requestFriend: userId }
                            }
                        )
                    } else {
                        // Chỉ xóa khỏi requestFriend nếu đã có trong friendList
                        await User.updateOne(
                            { _id: userBId },
                            { $pull: { requestFriend: userId } }
                        )
                    }

                    // Emit to both users
                    socket.emit('SERVER_ACCEPT_FRIEND_SUCCESS', {
                        code: 200,
                        message: 'Chấp nhận kết bạn thành công!',
                        userBId: userBId,
                        roomChatId: roomChatId
                    })

                    socket.broadcast.emit('SERVER_FRIEND_ACCEPTED', {
                        userAId: userId,
                        userAName: fullName,
                        roomChatId: roomChatId
                    })

                } else {
                    socket.emit('SERVER_ACCEPT_FRIEND_ERROR', {
                        code: 400,
                        message: 'Người dùng không tồn tại!'
                    })
                }
            } catch (error) {
                socket.emit('SERVER_ACCEPT_FRIEND_ERROR', {
                    code: 400,
                    message: 'Lỗi!'
                })
            }
        })

        // Từ chối kết bạn
        socket.on('CLIENT_REFUSE_FRIEND', async (data) => {
            try {
                const userBId = data.userBId
                const userId = data.userId
                const fullName = data.fullName
                
                if (!userId || !fullName) {
                    socket.emit('SERVER_REFUSE_FRIEND_ERROR', {
                        code: 400,
                        message: 'User information missing!'
                    })
                    return
                }

                const existUserB = await User.findOne({
                    _id: userBId,
                    status: 'active',
                    deleted: false
                })

                if(existUserB) {
                    await User.updateOne(
                        { _id: userId },
                        {
                            $pull: { acceptFriend: userBId }
                        }
                    )

                    await User.updateOne(
                        { _id: userBId },
                        {
                            $pull: { requestFriend: userId }
                        }
                    )

                    socket.emit('SERVER_REFUSE_FRIEND_SUCCESS', {
                        code: 200,
                        message: 'Đã từ chối kết bạn!',
                        userBId: userBId
                    })

                    socket.broadcast.emit('SERVER_FRIEND_REFUSED', {
                        userAId: userId,
                        userAName: fullName
                    })

                } else {
                    socket.emit('SERVER_REFUSE_FRIEND_ERROR', {
                        code: 400,
                        message: 'Người dùng không tồn tại!'
                    })
                }
            } catch (error) {
                socket.emit('SERVER_REFUSE_FRIEND_ERROR', {
                    code: 400,
                    message: 'Lỗi!'
                })
            }
        })

        // Hủy yêu cầu kết bạn
        socket.on('CLIENT_CANCEL_FRIEND', async (data) => {
            try {
                const userBId = data.userBId
                const userId = data.userId
                const fullName = data.fullName
                
                if (!userId || !fullName) {
                    socket.emit('SERVER_CANCEL_FRIEND_ERROR', {
                        code: 400,
                        message: 'User information missing!'
                    })
                    return
                }

                const existUserB = await User.findOne({
                    _id: userBId,
                    status: 'active',
                    deleted: false
                })

                if(existUserB) {
                    await User.updateOne(
                        { _id: userId },
                        {
                            $pull: { requestFriend: userBId }
                        }
                    )

                    await User.updateOne(
                        { _id: userBId },
                        {
                            $pull: { acceptFriend: userId }
                        }
                    )

                    socket.emit('SERVER_CANCEL_FRIEND_SUCCESS', {
                        code: 200,
                        message: 'Đã hủy yêu cầu kết bạn!',
                        userBId: userBId
                    })

                    socket.broadcast.emit('SERVER_FRIEND_REQUEST_CANCELLED', {
                        userAId: userId,
                        userAName: fullName
                    })

                } else {
                    socket.emit('SERVER_CANCEL_FRIEND_ERROR', {
                        code: 400,
                        message: 'Người dùng không tồn tại!'
                    })
                }
            } catch (error) {
                socket.emit('SERVER_CANCEL_FRIEND_ERROR', {
                    code: 400,
                    message: 'Lỗi!'
                })
            }
        })

        // Xóa bạn bè
        socket.on('CLIENT_DELETE_FRIEND', async (data) => {
            try {
                const userBId = data.userBId
                const userId = data.userId
                const fullName = data.fullName
                
                if (!userId || !fullName) {
                    socket.emit('SERVER_DELETE_FRIEND_ERROR', {
                        code: 400,
                        message: 'User information missing!'
                    })
                    return
                }

                const existUserB = await User.findOne({
                    _id: userBId,
                    status: 'active',
                    deleted: false
                })

                if(existUserB) {
                    // Tìm room chat giữa 2 người
                    const userA = await User.findById(userId)
                    const roomChatInfo = userA.friendList.find(item => item.user_id == userBId)

                    if(roomChatInfo) {
                        // Xóa room chat
                        await RoomChat.updateOne(
                            { _id: roomChatInfo.room_chat_id },
                            { 
                                deleted: true,
                                deletedAt: new Date()
                            }
                        )
                    }

                    // Xóa khỏi friendList của cả 2 user
                    await User.updateOne(
                        { _id: userId },
                        {
                            $pull: { friendList: { user_id: userBId } }
                        }
                    )

                    await User.updateOne(
                        { _id: userBId },
                        {
                            $pull: { friendList: { user_id: userId } }
                        }
                    )

                    socket.emit('SERVER_DELETE_FRIEND_SUCCESS', {
                        code: 200,
                        message: 'Đã xóa bạn bè!',
                        userBId: userBId
                    })

                    socket.broadcast.emit('SERVER_FRIEND_DELETED', {
                        userAId: userId,
                        userAName: fullName
                    })

                } else {
                    socket.emit('SERVER_DELETE_FRIEND_ERROR', {
                        code: 400,
                        message: 'Người dùng không tồn tại!'
                    })
                }
            } catch (error) {
                socket.emit('SERVER_DELETE_FRIEND_ERROR', {
                    code: 400,
                    message: 'Lỗi!'
                })
            }
        })
    })
}