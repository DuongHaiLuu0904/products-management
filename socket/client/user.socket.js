import User from '../../models/user.model.js'

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
            const exitUserBInA = await findOne({ 
                _id: myUserId,
                requestFriend: userId 
            })

            if(exitUserBInA) {
                await updateOne(
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
            const exitUserAInB = await findOne({ 
                _id: myUserId,
                acceptFriend: userId
            })

            if(exitUserAInB) {
                await updateOne(
                    { _id: myUserId },
                    { $pull: { acceptFriend: userId } }
                )
            }

            // Xóa user B trong requestFriend của user A
            const exitUserBInA = await findOne({ 
                _id: userId,
                requestFriend: myUserId 
            })

            if(exitUserBInA) {
                await updateOne(
                    { _id: userId },
                    { $pull: { requestFriend: myUserId } }
                )
            }
        })

        // chức năng chấp nhận yêu cầu kết bạn
        socket.on('Client_Accept_Friend', async (userId) => {
            const myUserId = res.locals.user.id

            // thêm {user_id, room_chat_id} của A vào friendList của B 
            // Xóa user A trong acceptFriend của user B
            const exitUserAInB = await findOne({ 
                _id: myUserId,
                acceptFriend: userId
            })

            if(exitUserAInB) {
                await updateOne(
                    { _id: myUserId },
                    { 
                        $push: { 
                            friendList: { user_id: userId, room_chat_id: '' }
                        },
                        $pull: { acceptFriend: userId } 
                    }
                )
            }

            // thêm {user_id, room_chat_id} của B vào friendList của A
            // Xóa user B trong requestFriend của user A
            const exitUserBInA = await findOne({ 
                _id: userId,
                requestFriend: myUserId 
            })

            if(exitUserBInA) {
                await updateOne(
                    { _id: userId },
                    { 
                        $push: { 
                            friendList: { user_id: myUserId, room_chat_id: '' }
                        },
                        $pull: { requestFriend: myUserId } 
                    }
                )
            }
        })
    })
}