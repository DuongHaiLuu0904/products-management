const User = require('../../models/user.model')

module.exports = async (res) => {
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
        })
    })
}