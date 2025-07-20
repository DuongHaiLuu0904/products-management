// Kết bạn
const dataUsersNotFriend = document.querySelector('[data-users-not-friend]')
if(dataUsersNotFriend) {
    const userId = dataUsersNotFriend.getAttribute('data-users-not-friend')
    
    const listBtnAddFriend = dataUsersNotFriend.querySelectorAll('[button-add-friend]')
    if(listBtnAddFriend.length > 0) {
        listBtnAddFriend.forEach(button => {
            button.addEventListener('click', () => {
                const userBId = button.getAttribute('button-add-friend')
                
                // Emit Socket.io event only
                socket.emit('CLIENT_ADD_FRIEND', { userBId: userBId })
                
                // Update UI immediately for better UX
                button.innerHTML = '<i class="fa-solid fa-clock"></i> Đã gửi'
                button.disabled = true
                button.classList.remove('btn-primary')
                button.classList.add('btn-warning')
            })
        })
    }
}

// Hủy lời mời kết bạn
const dataUsersRequest = document.querySelector('[data-users-request]')
if(dataUsersRequest) {
    const userId = dataUsersRequest.getAttribute('data-users-request')
    
    const listBtnCancelFriend = dataUsersRequest.querySelectorAll('[button-cancel-friend]')
    if(listBtnCancelFriend.length > 0) {
        listBtnCancelFriend.forEach(button => {
            button.addEventListener('click', () => {
                const userBId = button.getAttribute('button-cancel-friend')
                
                // Emit Socket.io event only
                socket.emit('CLIENT_CANCEL_FRIEND', { userBId: userBId })
                
                // Update UI immediately
                button.closest('.col-6').remove()
            })
        })
    }
}

// Chấp nhận kết bạn
const dataUsersAccept = document.querySelector('[data-users-accept]')
if(dataUsersAccept) {
    const userId = dataUsersAccept.getAttribute('data-users-accept')
    
    const listBtnAcceptFriend = dataUsersAccept.querySelectorAll('[button-accept-friend]')
    if(listBtnAcceptFriend.length > 0) {
        listBtnAcceptFriend.forEach(button => {
            button.addEventListener('click', () => {
                const userBId = button.getAttribute('button-accept-friend')
                
                // Emit Socket.io event only
                socket.emit('CLIENT_ACCEPT_FRIEND', { userBId: userBId })
                
                // Update UI immediately
                button.closest('.col-6').remove()
                
                // Cập nhật badge số lượng lời mời
                const badgeUsersAccept = document.querySelector('[badge-users-accept]')
                if(badgeUsersAccept) {
                    const currentCount = parseInt(badgeUsersAccept.innerText) || 0
                    badgeUsersAccept.innerText = Math.max(0, currentCount - 1)
                }
            })
        })
    }

    const listBtnRefuseFriend = dataUsersAccept.querySelectorAll('[button-refuse-friend]')
    if(listBtnRefuseFriend.length > 0) {
        listBtnRefuseFriend.forEach(button => {
            button.addEventListener('click', () => {
                const userBId = button.getAttribute('button-refuse-friend')
                
                // Emit Socket.io event only
                socket.emit('CLIENT_REFUSE_FRIEND', { userBId: userBId })
                
                // Update UI immediately
                button.closest('.col-6').remove()
                
                // Cập nhật badge số lượng lời mời
                const badgeUsersAccept = document.querySelector('[badge-users-accept]')
                if(badgeUsersAccept) {
                    const currentCount = parseInt(badgeUsersAccept.innerText) || 0
                    badgeUsersAccept.innerText = Math.max(0, currentCount - 1)
                }
            })
        })
    }
}

// Xóa bạn bè
const dataUsersFriends = document.querySelector('[data-users-friends]')
if(dataUsersFriends) {
    const userId = dataUsersFriends.getAttribute('data-users-friends')
    
    const listBtnDeleteFriend = dataUsersFriends.querySelectorAll('[button-delete-friend]')
    if(listBtnDeleteFriend.length > 0) {
        listBtnDeleteFriend.forEach(button => {
            button.addEventListener('click', () => {
                const userBId = button.getAttribute('button-delete-friend')
                
                if(confirm('Bạn có chắc chắn muốn xóa bạn bè này?')) {
                    // Emit Socket.io event only
                    socket.emit('CLIENT_DELETE_FRIEND', { userBId: userBId })
                    
                    // Update UI immediately
                    button.closest('.col-6').remove()
                }
            })
        })
    }
}

// ===== SOCKET.IO EVENT LISTENERS FOR REALTIME UPDATES =====

// Listen for add friend responses
socket.on('SERVER_ADD_FRIEND_SUCCESS', (data) => {
    console.log(data.message)
    // Additional UI updates can be added here
})

socket.on('SERVER_ADD_FRIEND_ERROR', (data) => {
    console.error(data.message)
    alert(data.message)
})

// Listen for accept friend responses  
socket.on('SERVER_ACCEPT_FRIEND_SUCCESS', (data) => {
    console.log(data.message)
    // Redirect to chat with new friend
    if(data.roomChatId) {
        // Could redirect to chat room or show success message
        console.log('New chat room created:', data.roomChatId)
    }
})

socket.on('SERVER_ACCEPT_FRIEND_ERROR', (data) => {
    console.error(data.message)
    alert(data.message)
})

// Listen for refuse friend responses
socket.on('SERVER_REFUSE_FRIEND_SUCCESS', (data) => {
    console.log(data.message)
})

socket.on('SERVER_REFUSE_FRIEND_ERROR', (data) => {
    console.error(data.message)
    alert(data.message)
})

// Listen for cancel friend responses
socket.on('SERVER_CANCEL_FRIEND_SUCCESS', (data) => {
    console.log(data.message)
})

socket.on('SERVER_CANCEL_FRIEND_ERROR', (data) => {
    console.error(data.message)
    alert(data.message)
})

// Listen for delete friend responses
socket.on('SERVER_DELETE_FRIEND_SUCCESS', (data) => {
    console.log(data.message)
})

socket.on('SERVER_DELETE_FRIEND_ERROR', (data) => {
    console.error(data.message)
    alert(data.message)
})

// Listen for incoming friend requests (realtime)
socket.on('SERVER_RECEIVE_FRIEND_REQUEST', (data) => {
    console.log(`Bạn nhận được lời mời kết bạn từ ${data.userAName}`)
    
    // Update badge count for accept friends
    const badgeUsersAccept = document.querySelector('[badge-users-accept]')
    if(badgeUsersAccept) {
        const currentCount = parseInt(badgeUsersAccept.innerText) || 0
        badgeUsersAccept.innerText = currentCount + 1
    }
    
    // Show notification
    if(window.Notification && Notification.permission === 'granted') {
        new Notification('Lời mời kết bạn mới', {
            body: `${data.userAName} đã gửi lời mời kết bạn cho bạn`,
            icon: '/images/avatar.jpg'
        })
    }
})

// Listen for friend request accepted (realtime)
socket.on('SERVER_FRIEND_ACCEPTED', (data) => {
    console.log(`${data.userAName} đã chấp nhận lời mời kết bạn của bạn`)
    
    // Show notification
    if(window.Notification && Notification.permission === 'granted') {
        new Notification('Kết bạn thành công', {
            body: `${data.userAName} đã chấp nhận lời mời kết bạn của bạn`,
            icon: '/images/avatar.jpg'
        })
    }
})

// Listen for friend request refused (realtime)
socket.on('SERVER_FRIEND_REFUSED', (data) => {
    console.log(`${data.userAName} đã từ chối lời mời kết bạn của bạn`)
})

// Listen for friend request cancelled (realtime)
socket.on('SERVER_FRIEND_REQUEST_CANCELLED', (data) => {
    console.log(`${data.userAName} đã hủy lời mời kết bạn`)
    
    // Update badge count
    const badgeUsersAccept = document.querySelector('[badge-users-accept]')
    if(badgeUsersAccept) {
        const currentCount = parseInt(badgeUsersAccept.innerText) || 0
        badgeUsersAccept.innerText = Math.max(0, currentCount - 1)
    }
})

// Listen for friend deleted (realtime)
socket.on('SERVER_FRIEND_DELETED', (data) => {
    console.log(`${data.userAName} đã xóa bạn khỏi danh sách bạn bè`)
    
    // Show notification
    if(window.Notification && Notification.permission === 'granted') {
        new Notification('Bạn bè đã bị xóa', {
            body: `${data.userAName} đã xóa bạn khỏi danh sách bạn bè`,
            icon: '/images/avatar.jpg'
        })
    }
})

// Request notification permission on page load
if(window.Notification && Notification.permission === 'default') {
    Notification.requestPermission()
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
