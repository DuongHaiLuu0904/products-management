// chức năng gửi yêu cầu kết bạn
const listBtnAddFriend = document.querySelectorAll('[button-add-friend]')
if(listBtnAddFriend.length > 0) {
    listBtnAddFriend.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.box-user').classList.add('add')

            const userId = btn.getAttribute('button-add-friend')
            
            socket.emit('Client_Add_Friend', userId)
        })
    })
}

// chức năng hủy yêu cầu kết bạn
const listBtnCancelFriend = document.querySelectorAll('[button-cancel-friend]')
if(listBtnCancelFriend.length > 0) {
    listBtnCancelFriend.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.box-user').classList.remove('add')

            const userId = btn.getAttribute('button-cancel-friend')
            console.log(userId)
            
            socket.emit('Client_Cancel_Friend', userId)
        })
    })
}

// chức năng chấp nhận yêu cầu kết bạn
const listBtnAcceptFriend = document.querySelectorAll('[button-accept-friend]')
if(listBtnAcceptFriend.length > 0) {
    listBtnAcceptFriend.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.box-user').classList.add('accepted')

            const userId = btn.getAttribute('button-accept-friend')
            
            socket.emit('Client_Accept_Friend', userId)
        })
    })
}

// chức năng từ chối yêu cầu kết bạn
const listBtnRefuseFriend = document.querySelectorAll('[button-refuse-friend]')
if(listBtnRefuseFriend.length > 0) {
    listBtnRefuseFriend.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.box-user').classList.add('refuse')
            
            const userId = btn.getAttribute('button-refuse-friend')
            
            socket.emit('Client_Refuse_Friend', userId)
        })
    })
}