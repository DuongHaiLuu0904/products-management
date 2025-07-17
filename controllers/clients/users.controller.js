import User from '../../models/user.model.js'
import userSocket from '../../socket/client/user.socket.js'

// [GET] /users/not-friend
export async function notFriend(req, res) {
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
export async function request(req, res) {
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
export async function accept(req, res) {
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
