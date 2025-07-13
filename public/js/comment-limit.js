// Hiển thị số ký tự còn lại cho textarea bình luận
const textarea = document.getElementById('content');
const remainingSpan = document.getElementById('content-remaining');
const maxLength = 500;
const maxBytes = 5 * 1024; // 5KB

function getByteLength(str) {
    return new Blob([str]).size;
}

if (textarea && remainingSpan) {
    textarea.addEventListener('input', function () {
        let value = textarea.value;
        // Giới hạn số ký tự
        if (value.length > maxLength) {
            value = value.substring(0, maxLength);
            textarea.value = value;
        }
        // Giới hạn kích thước dữ liệu
        if (getByteLength(value) > maxBytes) {
            // Cắt bớt cho đến khi vừa đủ
            while (getByteLength(value) > maxBytes) {
                value = value.substring(0, value.length - 1);
            }
            textarea.value = value;
            alert('Nội dung bình luận không được vượt quá 1KB dữ liệu!');
        }
        const currentLength = value.length;
        const remaining = maxLength - currentLength;
        remainingSpan.textContent = remaining >= 0 ? remaining : 0;
    });
}
