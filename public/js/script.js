// Quantity control functionality
function decreaseQuantity() {
    const input = document.getElementById('quantity-input');
    const currentValue = parseInt(input.value);
    const minValue = parseInt(input.min);
    
    if (currentValue > minValue) {
        input.value = currentValue - 1;
    }
}

function increaseQuantity() {
    const input = document.getElementById('quantity-input');
    const currentValue = parseInt(input.value);
    const maxValue = parseInt(input.max);
    
    if (currentValue < maxValue) {
        input.value = currentValue + 1;
    }
}

// Show alert
const showAlert = document.querySelector("[show-alert]")
if(showAlert) {
    console.log(showAlert)
    const time = parseInt(showAlert.getAttribute("data-time"))

    setTimeout(() => {
        showAlert.classList.add("alert-hidden")
    }, time)

    const closeAlert = showAlert.querySelector("[close-alert]")

    closeAlert.addEventListener("click", () => {
        showAlert.classList.add("alert-hidden")
    })
}
// End Show alert

// Phân trang
const buttonPagination = document.querySelectorAll("[button-pagination]")
if(buttonPagination) {
    let url = new URL(window.location.href)

    buttonPagination.forEach(button => {
        button.addEventListener("click", () => {
            const page = button.getAttribute("button-pagination")
        
            url.searchParams.set("page", page)

            window.location.href = url.href
        })
    })
}

// Upload Image
const uploadImage = document.querySelector("[upload-image]")
if(uploadImage) {
    const uploadImageInput = document.querySelector("[upload-image-input]")
    const uploadImagePreview = document.querySelector("[upload-image-preview]")
    
    uploadImageInput.addEventListener("change", (e) => {
        const file = e.target.files[0]

        if(file) {
            uploadImagePreview.src = URL.createObjectURL(file)  
        }
    })

    // Sửa lại phần này để đảm bảo nút xóa ảnh hoạt động đúng
    const closeImage = document.querySelector("[close-image]")
    if(closeImage) {
        closeImage.addEventListener("click", () => {
            if(uploadImagePreview) {
                uploadImagePreview.src = ""
                if(uploadImageInput) {
                    uploadImageInput.value = ""
                }
            }
        })
    }
}
// End Upload Image