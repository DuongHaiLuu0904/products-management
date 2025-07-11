class StarRating {
    constructor() {
        this.init();
    }

    init() {
        // Đợi DOM load xong hoặc jQuery sẵn sàng
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    // Polyfill cho matches() method
    matches(element, selector) {
        if (!element) return false;
        
        // Sử dụng matches() nếu có
        if (element.matches) {
            return element.matches(selector);
        }
        
        // Fallback cho IE
        if (element.msMatchesSelector) {
            return element.msMatchesSelector(selector);
        }
        
        // Fallback cuối cùng
        if (element.webkitMatchesSelector) {
            return element.webkitMatchesSelector(selector);
        }
        
        // Manual check bằng className và tagName
        if (selector.startsWith('.')) {
            const className = selector.substring(1);
            return element.classList && element.classList.contains(className);
        }
        
        return false;
    }

    // Kiểm tra element có khớp với selector không
    elementMatches(element, selector) {
        if (!element || !element.classList) return false;
        
        const selectors = selector.split(' ').filter(s => s.trim());
        let currentElement = element;
        
        for (let i = selectors.length - 1; i >= 0; i--) {
            const sel = selectors[i];
            let found = false;
            
            while (currentElement && currentElement !== document) {
                if (sel.startsWith('.') && currentElement.classList.contains(sel.substring(1))) {
                    found = true;
                    break;
                } else if (sel.startsWith('#') && currentElement.id === sel.substring(1)) {
                    found = true;
                    break;
                } else if (currentElement.tagName && currentElement.tagName.toLowerCase() === sel.toLowerCase()) {
                    found = true;
                    break;
                }
                currentElement = currentElement.parentElement;
            }
            
            if (!found) return false;
            if (i > 0) currentElement = currentElement.parentElement;
        }
        
        return true;
    }

    // Hàm cập nhật hiển thị sao
    updateStars(container, rating) {
        const stars = container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.remove('selected');
            if (index < rating) {
                star.classList.add('selected');
            }
        });
    }

    // Hàm lấy rating text
    getRatingText(rating) {
        const texts = {
            1: 'Rất tệ',
            2: 'Tệ', 
            3: 'Bình thường',
            4: 'Tốt',
            5: 'Rất tốt'
        };
        return rating > 0 ? `Bạn đã chọn ${rating} sao - ${texts[rating]}` : 'Vui lòng chọn số sao đánh giá';
    }

    // Tìm element cha gần nhất với selector
    closest(element, selector) {
        while (element && element !== document) {
            if (this.matches(element, selector)) {
                return element;
            }
            element = element.parentNode;
        }
        return null;
    }

    // Xử lý click vào sao
    handleStarClick(starElement) {
        const rating = parseInt(starElement.dataset.rating);
        const container = this.closest(starElement, '.star-rating');
        const formGroup = this.closest(starElement, '.form-group');
        const hiddenInput = formGroup.querySelector('input[type="hidden"]');
        const ratingText = formGroup.querySelector('.rating-text, .edit-rating-text');
        
        hiddenInput.value = rating;
        this.updateStars(container, rating);
        if (ratingText) {
            ratingText.textContent = this.getRatingText(rating);
        }
        
        // Thêm effect khi click
        starElement.classList.add('star-clicked');
        setTimeout(() => {
            starElement.classList.remove('star-clicked');
        }, 200);
    }

    // Xử lý hover vào sao
    handleStarHover(starElement) {
        const rating = parseInt(starElement.dataset.rating);
        const container = this.closest(starElement, '.star-rating');
        
        // Tạm thời hiển thị preview khi hover
        const stars = container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.classList.remove('hover-preview');
            if (index < rating) {
                star.classList.add('hover-preview');
            }
        });
    }

    // Xử lý rời chuột khỏi sao
    handleStarLeave(starElement) {
        const container = this.closest(starElement, '.star-rating');
        const formGroup = this.closest(starElement, '.form-group');
        const hiddenInput = formGroup.querySelector('input[type="hidden"]');
        const currentRating = parseInt(hiddenInput.value) || 0;
        
        // Xóa preview và hiển thị lại rating thực tế
        const stars = container.querySelectorAll('.star');
        stars.forEach(star => star.classList.remove('hover-preview'));
        this.updateStars(container, currentRating);
    }

    // Xử lý mở modal edit
    handleEditModal(button) {
        // Chuyển đổi từ kebab-case sang camelCase  
        const commentId = button.getAttribute('data-comment-id') || button.dataset.commentId;
        const content = button.getAttribute('data-content') || button.dataset.content;
        const rating = parseInt(button.getAttribute('data-rating') || button.dataset.rating);
        
        const editForm = document.getElementById('editCommentForm');
        const editContent = document.getElementById('editContent');
        const editRating = document.getElementById('editRating');
        const editRatingText = document.querySelector('#editCommentModal .edit-rating-text');
        
        if (editForm && commentId) {
            // Set action URL với _method=PATCH như mẫu admin
            editForm.action = `/products/comment/edit/${commentId}?_method=PATCH`;
        }
        if (editContent) editContent.value = content || '';
        if (editRating) editRating.value = rating || '';
        
        // Cập nhật hiển thị sao trong modal
        const modalContainer = document.querySelector('#editCommentModal .star-rating');
        if (modalContainer) {
            this.updateStars(modalContainer, rating);
        }
        if (editRatingText) {
            editRatingText.textContent = this.getRatingText(rating);
        }
        
        // Hiển thị modal (Bootstrap 4/5)
        const modal = document.getElementById('editCommentModal');
        if (modal) {
            // Nếu có jQuery và Bootstrap
            if (typeof $ !== 'undefined' && $.fn.modal) {
                $(modal).modal('show');
            } else if (typeof bootstrap !== 'undefined') {
                // Bootstrap 5
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            }
        }
    }

    // Reset form khi đóng modal
    handleModalReset() {
        const container = document.querySelector('#editCommentModal .star-rating');
        const hiddenInput = document.querySelector('#editCommentModal input[type="hidden"]');
        const ratingText = document.querySelector('#editCommentModal .edit-rating-text');
        
        if (hiddenInput) hiddenInput.value = '';
        if (container) this.updateStars(container, 0);
        if (ratingText) ratingText.textContent = this.getRatingText(0);
    }

    // Validate form trước khi submit
    validateForm(form) {
        const ratingInput = form.querySelector('input[name="rating"]');
        const rating = ratingInput ? ratingInput.value : '';
        
        if (!rating || rating === '') {
            alert('Vui lòng chọn số sao đánh giá!');
            return false;
        }
        
        return true;
    }

    // Bind tất cả events
    bindEvents() {
        const self = this;

        // Click vào sao cho form thêm comment
        document.addEventListener('click', function(e) {
            if (e.target && e.target.classList && 
                e.target.classList.contains('star') && 
                self.closest(e.target, '.comment-form')) {
                self.handleStarClick(e.target);
            }
        });

        // Hover vào sao cho form thêm comment
        document.addEventListener('mouseenter', function(e) {
            if (e.target && e.target.classList && 
                e.target.classList.contains('star') && 
                self.closest(e.target, '.comment-form')) {
                self.handleStarHover(e.target);
            }
        }, true);

        document.addEventListener('mouseleave', function(e) {
            if (e.target && e.target.classList && 
                e.target.classList.contains('star') && 
                self.closest(e.target, '.comment-form')) {
                self.handleStarLeave(e.target);
            }
        }, true);

        // Click vào sao cho modal edit
        document.addEventListener('click', function(e) {
            if (e.target && e.target.classList && 
                e.target.classList.contains('star') && 
                self.closest(e.target, '#editCommentModal')) {
                self.handleStarClick(e.target);
            }
        });

        // Hover vào sao cho modal edit
        document.addEventListener('mouseenter', function(e) {
            if (e.target && e.target.classList && 
                e.target.classList.contains('star') && 
                self.closest(e.target, '#editCommentModal')) {
                self.handleStarHover(e.target);
            }
        }, true);

        document.addEventListener('mouseleave', function(e) {
            if (e.target && e.target.classList && 
                e.target.classList.contains('star') && 
                self.closest(e.target, '#editCommentModal')) {
                self.handleStarLeave(e.target);
            }
        }, true);

        // Xử lý nút edit comment
        document.addEventListener('click', function(e) {
            if (e.target && e.target.classList && 
                e.target.classList.contains('edit-comment-btn')) {
                self.handleEditModal(e.target);
            }
        });

        // Reset modal khi đóng (nếu có jQuery)
        if (typeof $ !== 'undefined') {
            $(document).on('hidden.bs.modal', '#editCommentModal', function() {
                self.handleModalReset();
            });
        }

        // Validate form trước khi submit
        document.addEventListener('submit', function(e) {
            if (e.target && (
                (e.target.id === 'form-create-comment') || 
                (e.target.id === 'editCommentForm'))) {
                if (!self.validateForm(e.target)) {
                    e.preventDefault();
                    return false;
                }
            }
        });

        // Thêm animation cho sao khi hover
        document.addEventListener('mouseenter', function(e) {
            if (e.target && e.target.classList && e.target.classList.contains('star')) {
                e.target.style.transform = 'scale(1.1)';
            }
        }, true);

        document.addEventListener('mouseleave', function(e) {
            if (e.target && e.target.classList && e.target.classList.contains('star')) {
                e.target.style.transform = 'scale(1)';
            }
        }, true);
    }
}

// Khởi tạo khi DOM ready hoặc ngay lập tức nếu đã ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        new StarRating();
    });
} else {
    new StarRating();
}
