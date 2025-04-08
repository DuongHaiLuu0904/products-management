const User = require('../../models/user.model.js')

const userSocket = require('../../socket/client/user.socket')

// [GET] /users/not-friend
exports.notFriend = async (req, res) => {
    userSocket(res)

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

    res.render('client/pages/users/not-friend', {
        title: 'Danh sách người dùng',
        users: users
    })
}

// [GET] /users/request
exports.request = async (req, res) => {
    userSocket(res)

    const userId = res.locals.user.id

    const myUser = await User.findOne({ _id: userId })

    const requestFriend = myUser.requestFriend

    const users = await User.find({
        _id: { $in: requestFriend },
        status: 'active',
        deleted: false
    }).select('id fullName avatar')

    res.render('client/pages/users/request', {
        title: 'Lời mời đã gửi',
        users: users
    })
}

// [GET] /users/accept
exports.accept = async (req, res) => {
    userSocket(res)

    const userId = res.locals.user.id
    const myUser = await User.findOne({ _id: userId })

    const acceptFriend = myUser.acceptFriend

    const users = await User.find({
        _id: { $in: acceptFriend },
        status: 'active',
        deleted: false
    }).select('id fullName avatar')

    res.render('client/pages/users/accept', {
        title: 'Lời mời đã nhận',
        users: users
    })
}

