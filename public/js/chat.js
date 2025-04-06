import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js'

// Khởi tạo FileUploadWithPreview với các tùy chọn cải tiến
const upload = new FileUploadWithPreview.FileUploadWithPreview('upload-image', {
    multiple: true,
    maxFileCount: 6,
    text: {
        browse: 'Chọn ảnh',
        chooseFile: 'Tải lên'
    },
    presetFiles: [], // Không có ảnh xem trước mặc định
    showDeleteButtonOnImages: true, // Hiển thị nút xóa trên mỗi ảnh
    imagesContainerHeight: '150px', // Chiều cao của container hiển thị ảnh
});

// Function to scroll chat to bottom
function scrollToBottom() {
    const chat = document.querySelector('.chat-container .inner-body')
    if(chat) {
        chat.scrollTop = chat.scrollHeight
    }
}

// Xử lý container file uploads
const fileContainer = document.querySelector('.chat-container .custom-file-container')
if (fileContainer) {
    // Ẩn container nếu không có file
    if (!upload.cachedFileArray || upload.cachedFileArray.length === 0) {
        fileContainer.classList.remove('has-files')
    } else {
        fileContainer.classList.add('has-files')
    }
    
    // Thiết lập sự kiện onChange để hiển thị hoặc ẩn container tùy theo số lượng file
    upload.options.onChange = function() {
        if (upload.cachedFileArray && upload.cachedFileArray.length > 0) {
            fileContainer.classList.add('has-files')
        } else {
            fileContainer.classList.remove('has-files')
        }
    }
    
    // Xử lý nút xóa tất cả ảnh
    const clearAllButton = fileContainer.querySelector('.preview-title .clear-all')
    if (clearAllButton) {
        clearAllButton.addEventListener('click', function(e) {
            e.preventDefault()
            upload.resetPreviewPanel()
            fileContainer.classList.remove('has-files')
        })
    }
}

// Client send message
const formSendData = document.querySelector('.chat-container .inner-form')
if(formSendData) {
    formSendData.addEventListener('submit', (e) => {
        e.preventDefault()
        const content = e.target.content.value.trim()
        const images = upload.cachedFileArray || []

        if(content || images.length > 0) {
            // Gửi tin nhắn và ảnh lên server 
            socket.emit('Client_Send_Message', {
                content: content,
                images: images
            })
            
            // Xóa nội dung input và reset file upload
            e.target.content.value = ''
            upload.resetPreviewPanel()
            
            // Ẩn container file upload
            if (fileContainer) {
                fileContainer.classList.remove('has-files')
            }
            
            // Reset trạng thái typing
            socket.emit('Client_Send_Typing', 'hidden')
            clearTimeout(timeOut)
            
            scrollToBottom()
        }
    })
}

// Server return message
socket.on('Server_Return_Message', (data) => {
    const myId = document.querySelector('.chat-container').getAttribute('my-id')
    const chat = document.querySelector('.chat-container .inner-body')
    const boxTyping = chat.querySelector('.inner-list-typing')
    
    const div = document.createElement('div')

    let htmlFullName = ''

    if(myId == data.userId) {
        div.classList.add('inner-outgoing')
    } else {
        div.classList.add('inner-incoming')
        htmlFullName = `<div class="inner-name">${data.fullName}</div>`
    }
    
    // Content HTML
    let htmlContent = ''
    if(data.content) {
        htmlContent = `<div class="inner-content">${data.content}</div>`
    }
    
    // Images HTML
    let htmlImages = ''
    if(data.images && data.images.length > 0) {
        let imagesElement = '<div class="inner-images">'
        for(const image of data.images) {
            imagesElement += `<img src="${image}" alt="Chat image" onclick="openImagePreview('${image}')">`
        }
        imagesElement += '</div>'
        htmlImages = imagesElement
    }

    div.innerHTML = `
        ${htmlFullName}
        ${htmlContent}
        ${htmlImages}
    `
    
    if (boxTyping) {
        chat.insertBefore(div, boxTyping);
    } else {
        chat.appendChild(div);
    }
    
    // Đảm bảo cuộn xuống bên dưới sau khi thêm tin nhắn mới
    setTimeout(scrollToBottom, 100)
})

//Show typing
var timeOut
const showTyping = () => {
    const input = document.querySelector('.chat-container .inner-form input[name="content"]')
    // Chỉ hiển thị đang gõ khi có nội dung
    if(input && input.value.trim()) {
        socket.emit('Client_Send_Typing', 'show')

        clearTimeout(timeOut)

        timeOut = setTimeout(() => {
            socket.emit('Client_Send_Typing', 'hidden')
        }, 3000)
    }
}

// Scroll chat to bottom on initial load
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(scrollToBottom, 300);
});

// Emoji picker
const buttonIcon = document.querySelector('.chat-container .button-icon')
if(buttonIcon) {
    const tooltip = document.querySelector('.tooltip')
    
    // Chỉ khởi tạo popper nếu tooltip tồn tại
    if(tooltip) {
        const popperInstance = Popper.createPopper(buttonIcon, tooltip, {
            placement: 'top-end',
            modifiers: [
                {
                    name: 'offset',
                    options: {
                        offset: [0, 10],
                    },
                },
            ],
        });
        
        // Hiển thị/ẩn emoji picker
        buttonIcon.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            tooltip.classList.toggle('show')
            
            // Cập nhật vị trí khi hiển thị
            if(tooltip.classList.contains('show')) {
                popperInstance.update()
            }
        })
    }
}

const emojiPicker = document.querySelector('emoji-picker')
if(emojiPicker) {
    const input = document.querySelector('.chat-container .inner-form input[name="content"]')

    emojiPicker.addEventListener('emoji-click', (event) => {
        const icon = event.detail.unicode
        input.value += icon

        const end = input.value.length
        input.setSelectionRange(end, end)
        input.focus()

        showTyping()
    })

    input.addEventListener('keyup', (e) => {
        showTyping()
    })
}

// Server return typing
const listTyping = document.querySelector('.chat-container .inner-list-typing')
if(listTyping) {
    socket.on('Server_Return_Typing', (data) => {
        if(data.type == 'show') {
            const existsTyping = listTyping.querySelector(`[user-id="${data.userId}"]`)
            
            if(!existsTyping) {
                const boxTyping = document.createElement('div')
                boxTyping.classList.add('box-typing')

                boxTyping.setAttribute('user-id', data.userId)
                boxTyping.innerHTML = `
                    <div class="inner-name">${data.fullName}</div>
                    <div class="inner-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                `
                listTyping.appendChild(boxTyping)
                scrollToBottom()
            }
        } else if(data.type == 'hidden') {
            const boxTypingRemove = listTyping.querySelector(`[user-id="${data.userId}"]`)
            
            if(boxTypingRemove) {
                listTyping.removeChild(boxTypingRemove)
            }
        }
    })
}

// Xử lý tải lên hình ảnh
const buttonAddImages = document.querySelector('.chat-container .button-add-images')
if (buttonAddImages) {
    const fileInput = buttonAddImages.querySelector('input[type="file"]')
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (fileInput.files && fileInput.files.length > 0) {
                // Sử dụng FileUploadWithPreview để hiển thị hình ảnh đã chọn
                upload.addFiles(fileInput.files)
                
                // Hiển thị container file upload
                if (fileContainer) {
                    fileContainer.classList.add('has-files')
                }
                
                fileInput.value = '' // Reset giá trị input file để có thể chọn lại cùng file nếu cần
            }
        })
    }
}

// Xem hình ảnh lớn trong modal
window.openImagePreview = (imageSrc) => {
    // Xóa modal cũ nếu tồn tại
    const existingModal = document.querySelector('.image-preview-modal')
    if(existingModal) {
        document.body.removeChild(existingModal)
    }
    
    // Tạo modal mới
    const modal = document.createElement('div')
    modal.classList.add('image-preview-modal')
    
    modal.innerHTML = `
        <div class="image-preview-content">
            <span class="image-preview-close">&times;</span>
            <img src="${imageSrc}" alt="Preview Image">
        </div>
    `
    
    document.body.appendChild(modal)
    
    // Đóng modal khi nhấn nút X
    const closeBtn = modal.querySelector('.image-preview-close')
    closeBtn.onclick = () => {
        document.body.removeChild(modal)
    }
    
    // Đóng modal khi nhấn bên ngoài hình ảnh
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal)
        }
    }
}

// Xử lý phím ESC để đóng modal và emoji picker
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Đóng modal preview nếu đang mở
        const modal = document.querySelector('.image-preview-modal')
        if(modal) {
            document.body.removeChild(modal)
        }
        
        // Đóng emoji picker nếu đang mở
        const tooltip = document.querySelector('.tooltip')
        if(tooltip && tooltip.classList.contains('show')) {
            tooltip.classList.remove('show')
        }
    }
    
    // Ngăn chặn refresh trang khi nhấn Enter trong input
    if(e.key === 'Enter' && e.target.matches('.chat-container .inner-form input[name="content"]')) {
        e.preventDefault()
        const formSendData = document.querySelector('.chat-container .inner-form')
        if(formSendData) {
            formSendData.dispatchEvent(new Event('submit'))
        }
    }
})

// Đóng emoji picker khi click bên ngoài
document.addEventListener('click', (e) => {
    const tooltip = document.querySelector('.tooltip')
    const buttonIcon = document.querySelector('.chat-container .button-icon')
    
    if(tooltip && tooltip.classList.contains('show')) {
        if(!buttonIcon.contains(e.target) && !tooltip.contains(e.target)) {
            tooltip.classList.remove('show')
        }
    }
})

// Cập nhật lại vị trí của các phần tử khi thay đổi kích thước cửa sổ
window.addEventListener('resize', () => {
    // Cuộn xuống dưới
    scrollToBottom()
    
    // Cập nhật vị trí của emoji picker
    const tooltip = document.querySelector('.tooltip')
    const buttonIcon = document.querySelector('.chat-container .button-icon')
    if(tooltip && tooltip.classList.contains('show') && buttonIcon) {
        Popper.createPopper(buttonIcon, tooltip, {
            placement: 'top-end',
            modifiers: [
                {
                    name: 'offset',
                    options: {
                        offset: [0, 10],
                    },
                },
            ],
        }).update()
    }
})

