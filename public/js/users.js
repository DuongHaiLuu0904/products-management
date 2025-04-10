// chức năng gửi yêu cầu kết bạn
const listBtnAddFriend = document.querySelectorAll('[button-add-friend]')
if (listBtnAddFriend.length > 0) {
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
if (listBtnCancelFriend.length > 0) {
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
if (listBtnAcceptFriend.length > 0) {
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
if (listBtnRefuseFriend.length > 0) {
    listBtnRefuseFriend.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.box-user').classList.add('refuse')

            const userId = btn.getAttribute('button-refuse-friend')

            socket.emit('Client_Refuse_Friend', userId)
        })
    })
}

// chức năng cập nhật số lượng người dùng trong danh sách acceptFriend
socket.on('Server_Return_Length_Accept_Friend', (data) => {
    const badgeUsersAccept = document.querySelector('[badge-users-accept]')
    const userId = badgeUsersAccept.getAttribute('badge-users-accept')
    if (userId === data.userId) {
        badgeUsersAccept.innerHTML = data.lengthAcceptFriend
    }
})


// chức năng cập nhật thông tin người dùng trong danh sách acceptFriend
socket.on('Server_Return_Info_Accept_Friend', (data) => {
    // trang lời mời kết bạn
    const usersAccept = document.querySelector('[data-users-accept]')
    if(usersAccept) {
        const userId = usersAccept.getAttribute('data-users-accept')
        
        if (userId === data.userId) {
            // Vẽ user ra giao diện 
            const newBoxUser = document.createElement('div')
            newBoxUser.classList.add('col-6')
            newBoxUser.setAttribute('user-id', data.infoUserA._id)
            
            newBoxUser.innerHTML = `
                <div class="box-user">
                    <div class="inner-avatar">
                        <img src="/images/avatar.jpg" alt="${data.infoUserA.fullName}">
                    </div>
                    <div class="inner-info">
                        <div class="inner-name">${data.infoUserA.fullName}</div>
                        <div class="inner-buttons"> 
                            <button 
                                class="btn btn-primary btn-sm m-1" 
                                button-accept-friend="${data.infoUserA._id}"
                            >
                                <i class="fa-solid fa-user-check"></i>Chấp nhận
                            </button>
                            <button 
                                class="btn btn-secondary btn-sm m-1" 
                                button-refuse-friend="${data.infoUserA._id}"
                            >
                                <i class="fa-solid fa-xmark"></i>Từ chối
                            </button>
                            <button 
                                class="btn btn-danger btn-sm m-1" 
                                button-delete-friend="${data.infoUserA._id}" 
                                disabled=""
                            >
                                <i class="fa-solid fa-trash"></i>Đã xóa
                            </button>
                            <button 
                                class="btn btn-primary btn-sm m-1" 
                                button-accepted-friend="" 
                                disabled=""
                            >
                                <i class="fa-solid fa-check"></i>Đã chấp nhận
                            </button>
                        </div>
                    </div>
                </div>
            `
            
            usersAccept.appendChild(newBoxUser)

            // Xóa Lời mời kết bạn
            const btnRefuseFriend = document.querySelector('[button-refuse-friend]')
            btnRefuseFriend.addEventListener('click', () => {
                btnRefuseFriend.closest('.box-user').classList.add('refuse')

                const userId = btnRefuseFriend.getAttribute('button-refuse-friend')

                socket.emit('Client_Refuse_Friend', userId)
            })

            // chấp nhận lời mời kết bạn
            const btnAcceptFriend = document.querySelector('[button-accept-friend]')
            btnAcceptFriend.addEventListener('click', () => {
                btnAcceptFriend.closest('.box-user').classList.add('accepted')

                const userId = btnAcceptFriend.getAttribute('button-accept-friend')

                socket.emit('Client_Accept_Friend', userId)
            })
        }
    }

    // trang danh sách người dùng không là bạn
    const usersNotFriend = document.querySelector('[data-users-not-friend]')
    if(usersNotFriend) {
        const userId = usersNotFriend.getAttribute('data-users-not-friend')
        if(userId === data.userId) {
            const boxUser = usersNotFriend.querySelector(`[user-id="${data.userIdA}"]`)
            if(boxUser) {
                usersNotFriend.removeChild(boxUser)
            }
        }
    }
})

// chức năng xóa người dùng trong danh sách acceptFriend
socket.on('Server_Return_User_Id_Cancel_Friend', (data) => {
    const usersAccept = document.querySelector('[data-users-accept]')
    const userId = usersAccept.getAttribute('data-users-accept')
    if (userId === data.userId) {
        const boxUser = usersAccept.querySelector(`[user-id="${data.userIdA}"]`)
        if (boxUser) {
            usersAccept.removeChild(boxUser)
        }
    }
})
