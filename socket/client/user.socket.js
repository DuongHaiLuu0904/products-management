import User from '../../models/user.model.js'
import RoomChat from '../../models/room-chat.model.js'

export default async (res) => {
    _io.once('connection', (socket) => {
        // chức năng gửi yêu cầu kết bạn
        socket.on('Client_Add_Friend', async (userId) => {
            const myUserId = res.locals.user.id

            // check user A đã có user B trong danh sách yêu cầu kết bạn chưa
            const exitUserAInB = await User.findOne({ 
                _id: userId,
                acceptFriend: myUserId 
            })

            if(!exitUserAInB) {
                await User.updateOne(
                    { _id: userId },
                    { $push: { acceptFriend: myUserId } }
                )
            }

            // check user B đã có user A trong danh sách yêu cầu kết bạn chưa
            const exitUserBInA = await User.findOne({ 
                _id: myUserId,
                requestFriend: userId 
            })

            if(!exitUserBInA) {
                await User.updateOne(
                    { _id: myUserId },
                    { $push: { requestFriend: userId } }
                )
            }

            // cập nhật số lượng người dùng trong danh sách acceptFriend B
            const infoUserB = await User.findOne({ _id: userId })
            const countUserB = infoUserB.acceptFriend.length

            socket.broadcast.emit('Server_Return_Length_Accept_Friend', {
                userId: userId,
                lengthAcceptFriend: countUserB
            })  
            
            // Lấy thông tin của A trả về cho B
            const infoUserA = await User.findOne({ _id: myUserId }).select('id fullName avatar')
            
            socket.broadcast.emit('Server_Return_Info_Accept_Friend', {
                userId: userId,
                infoUserA: infoUserA
            })
        })

        // Tương thích với CLIENT_ADD_FRIEND
        socket.on('CLIENT_ADD_FRIEND', async (data) => {
            const userId = data.userBId
            const myUserId = res.locals.user.id

            // check user A đã có user B trong danh sách yêu cầu kết bạn chưa
            const exitUserAInB = await User.findOne({ 
                _id: userId,
                acceptFriend: myUserId 
            })

            if(!exitUserAInB) {
                await User.updateOne(
                    { _id: userId },
                    { $push: { acceptFriend: myUserId } }
                )
            }

            // check user B đã có user A trong danh sách yêu cầu kết bạn chưa
            const exitUserBInA = await User.findOne({ 
                _id: myUserId,
                requestFriend: userId 
            })

            if(!exitUserBInA) {
                await User.updateOne(
                    { _id: myUserId },
                    { $push: { requestFriend: userId } }
                )
            }

            // cập nhật số lượng người dùng trong danh sách acceptFriend B
            const infoUserB = await User.findOne({ _id: userId })
            const countUserB = infoUserB.acceptFriend.length

            socket.broadcast.emit('Server_Return_Length_Accept_Friend', {
                userId: userId,
                lengthAcceptFriend: countUserB
            })  
            
            // Lấy thông tin của A trả về cho B
            const infoUserA = await User.findOne({ _id: myUserId }).select('id fullName avatar')
            
            socket.broadcast.emit('Server_Return_Info_Accept_Friend', {
                userId: userId,
                infoUserA: infoUserA,
                userIdA: myUserId
            })
        })

        // chức năng hủy yêu cầu kết bạn
        socket.on('Client_Cancel_Friend', async (userId) => {
            const myUserId = res.locals.user.id

            // Xóa user A trong danh sách yêu cầu kết bạn của user B
            const exitUserAInB = await User.findOne({ 
                _id: userId,
                acceptFriend: myUserId 
            })

            if(exitUserAInB) {
                await User.updateOne(
                    { _id: userId },
                    { $pull: { acceptFriend: myUserId } }
                )
            }

            // Xóa user B trong danh sách yêu cầu kết bạn của user A
            const exitUserBInA = await User.findOne({ 
                _id: myUserId,
                requestFriend: userId 
            })

            if(exitUserBInA) {
                await User.updateOne(
                    { _id: myUserId },
                    { $pull: { requestFriend: userId } }
                )
            }

            // Lấy userId của A trả về cho B
            socket.broadcast.emit('Server_Return_User_Id_Cancel_Friend', {
                userId: userId,
                userIdA: myUserId
            })
        })

        // chức năng từ chối yêu cầu kết bạn
        socket.on('Client_Refuse_Friend', async (userId) => {
            const myUserId = res.locals.user.id

            // Xóa user A trong acceptFriend của user B
            const exitUserAInB = await User.findOne({ 
                _id: myUserId,
                acceptFriend: userId
            })

            if(exitUserAInB) {
                await User.updateOne(
                    { _id: myUserId },
                    { $pull: { acceptFriend: userId } }
                )
            }

            // Xóa user B trong requestFriend của user A
            const exitUserBInA = await User.findOne({ 
                _id: userId,
                requestFriend: myUserId 
            })

            if(exitUserBInA) {
                await User.updateOne(
                    { _id: userId },
                    { $pull: { requestFriend: myUserId } }
                )
            }
        })

        // chức năng chấp nhận yêu cầu kết bạn
        socket.on('Client_Accept_Friend', async (userId) => {
            const myUserId = res.locals.user.id

            // Kiểm tra xem đã có room chat giữa 2 người này chưa
            let existingRoom = await RoomChat.findOne({
                typeRoom: "friend",
                "users.user_id": { $all: [myUserId, userId] },
                deleted: false
            })

            let roomChatId = ''
            
            if(existingRoom) {
                roomChatId = existingRoom._id.toString()
                console.log('Sử dụng room chat đã tồn tại:', roomChatId)
            } else {
                // Tạo room chat mới nếu chưa có
                const newRoom = new RoomChat({
                    typeRoom: "friend",
                    users: [
                        { user_id: myUserId, role: "superAdmin" },
                        { user_id: userId, role: "superAdmin" }
                    ]
                })
                await newRoom.save()
                roomChatId = newRoom._id.toString()
                console.log('Tạo room chat mới:', roomChatId)
            }

            // thêm {user_id, room_chat_id} của A vào friendList của B 
            // Xóa user A trong acceptFriend của user B
            const exitUserAInB = await User.findOne({ 
                _id: myUserId,
                acceptFriend: userId
            })

            if(exitUserAInB) {
                await User.updateOne(
                    { _id: myUserId },
                    { 
                        $push: { 
                            friendList: { user_id: userId, room_chat_id: roomChatId }
                        },
                        $pull: { acceptFriend: userId } 
                    }
                )
            }

            // thêm {user_id, room_chat_id} của B vào friendList của A
            // Xóa user B trong requestFriend của user A
            const exitUserBInA = await User.findOne({ 
                _id: userId,
                requestFriend: myUserId 
            })

            if(exitUserBInA) {
                await User.updateOne(
                    { _id: userId },
                    { 
                        $push: { 
                            friendList: { user_id: myUserId, room_chat_id: roomChatId }
                        },
                        $pull: { requestFriend: myUserId } 
                    }
                )
            }

            // Lấy thông tin user để gửi thông báo
            const infoUserA = await User.findOne({ _id: userId }).select('id fullName avatar')
            const infoUserB = await User.findOne({ _id: myUserId }).select('id fullName avatar')

            // Thông báo cho người gửi lời mời (user A) biết rằng lời mời đã được chấp nhận
            socket.broadcast.emit('Server_Return_Friend_Accepted', {
                userId: userId, // ID của người gửi lời mời
                userIdB: myUserId, // ID của người chấp nhận
                infoUserB: infoUserB // Thông tin người chấp nhận
            })

            // Thông báo cho người chấp nhận (user B) biết rằng đã kết bạn thành công
            socket.emit('Server_Return_Accept_Friend_Success', {
                userId: myUserId,
                userIdA: userId,
                infoUserA: infoUserA
            })
        })

        // Tương thích với CLIENT_ACCEPT_FRIEND
        socket.on('CLIENT_ACCEPT_FRIEND', async (data) => {
            const userId = data.userBId
            const myUserId = res.locals.user.id

            // Kiểm tra xem đã có room chat giữa 2 người này chưa
            let existingRoom = await RoomChat.findOne({
                typeRoom: "friend",
                "users.user_id": { $all: [myUserId, userId] },
                deleted: false
            })

            let roomChatId = ''
            
            if(existingRoom) {
                roomChatId = existingRoom._id.toString()
                console.log('Sử dụng room chat đã tồn tại:', roomChatId)
            } else {
                // Tạo room chat mới nếu chưa có
                const newRoom = new RoomChat({
                    typeRoom: "friend",
                    users: [
                        { user_id: myUserId, role: "superAdmin" },
                        { user_id: userId, role: "superAdmin" }
                    ]
                })
                await newRoom.save()
                roomChatId = newRoom._id.toString()
                console.log('Tạo room chat mới:', roomChatId)
            }

            // thêm {user_id, room_chat_id} của A vào friendList của B 
            // Xóa user A trong acceptFriend của user B
            const exitUserAInB = await User.findOne({ 
                _id: myUserId,
                acceptFriend: userId
            })

            if(exitUserAInB) {
                await User.updateOne(
                    { _id: myUserId },
                    { 
                        $push: { 
                            friendList: { user_id: userId, room_chat_id: roomChatId }
                        },
                        $pull: { acceptFriend: userId } 
                    }
                )
            }

            // thêm {user_id, room_chat_id} của B vào friendList của A
            // Xóa user B trong requestFriend của user A
            const exitUserBInA = await User.findOne({ 
                _id: userId,
                requestFriend: myUserId 
            })

            if(exitUserBInA) {
                await User.updateOne(
                    { _id: userId },
                    { 
                        $push: { 
                            friendList: { user_id: myUserId, room_chat_id: roomChatId }
                        },
                        $pull: { requestFriend: myUserId } 
                    }
                )
            }

            // Lấy thông tin user để gửi thông báo
            const infoUserA = await User.findOne({ _id: userId }).select('id fullName avatar')
            const infoUserB = await User.findOne({ _id: myUserId }).select('id fullName avatar')

            // Thông báo cho người gửi lời mời (user A) biết rằng lời mời đã được chấp nhận
            socket.broadcast.emit('Server_Return_Friend_Accepted', {
                userId: userId, // ID của người gửi lời mời
                userIdB: myUserId, // ID của người chấp nhận
                infoUserB: infoUserB // Thông tin người chấp nhận
            })

            // Thông báo cho người chấp nhận (user B) biết rằng đã kết bạn thành công
            socket.emit('Server_Return_Accept_Friend_Success', {
                userId: myUserId,
                userIdA: userId,
                infoUserA: infoUserA
            })
        })
    })
}