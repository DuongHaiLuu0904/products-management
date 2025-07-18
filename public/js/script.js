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

// Thêm vào layout chính của client
(function() {
    let refreshTimer;
    
    // Tự động refresh token trước khi hết hạn
    function scheduleTokenRefresh() {
        // Refresh token sau 12 phút (3 phút trước khi access token hết hạn)
        refreshTimer = setTimeout(async () => {
            try {
                const response = await fetch('/user/refresh-token', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Token refreshed automatically');
                    
                    // Lên lịch refresh tiếp theo
                    scheduleTokenRefresh();
                } else {
                    console.log('Token refresh failed, redirecting to login');
                    window.location.href = '/user/login';
                }
            } catch (error) {
                console.error('Token refresh error:', error);
                window.location.href = '/user/login';
            }
        }, 12 * 60 * 1000); // 12 phút
    }
    
    // Intercept các request AJAX để xử lý token hết hạn
    function interceptAjaxRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = async function(url, options = {}) {
            const response = await originalFetch(url, options);
            
            // Kiểm tra nếu có header X-New-Access-Token (token đã được refresh)
            const newToken = response.headers.get('X-New-Access-Token');
            if (newToken) {
                console.log('Token was refreshed during request');
                // Reset timer
                clearTimeout(refreshTimer);
                scheduleTokenRefresh();
            }
            
            // Nếu unauthorized, redirect về login
            if (response.status === 401) {
                const data = await response.json();
                if (data.needsLogin) {
                    window.location.href = '/user/login';
                }
            }
            
            return response;
        };
    }
    
    // Khởi tạo khi trang load
    document.addEventListener('DOMContentLoaded', function() {
        // Chỉ chạy nếu user đã đăng nhập
        if (document.cookie.includes('accessToken')) {
            scheduleTokenRefresh();
            interceptAjaxRequests();
        }
    });
    
    // Dọn dẹp timer khi user logout
    window.addEventListener('beforeunload', function() {
        clearTimeout(refreshTimer);
    });
})();