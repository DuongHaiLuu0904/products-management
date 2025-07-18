// Change Status
const buttonsChangeStatus = document.querySelectorAll("[button-change-status]")
if(buttonsChangeStatus.length > 0) {
    const formChangeStatus = document.querySelector("#form-change-status")
    
    const path = formChangeStatus.getAttribute("data-path")
    
    buttonsChangeStatus.forEach(button => {
        button.addEventListener("click", () => {
            const statusCurrent = button.getAttribute("data-status")
            const id = button.getAttribute("data-id")

            let statusChange = statusCurrent == "active" ? "inactive" : "active"

            const action = path + `/${statusChange}/${id}?_method=PATCH`
            formChangeStatus.action = action
         
            formChangeStatus.submit()
        })
    })
}

// Delete item
const buttonDelete = document.querySelectorAll("[button-delete]")
if(buttonDelete.length > 0) {
    const formDeleteItem = document.querySelector("#form-delete-item")
    const path = formDeleteItem.getAttribute("data-path")

    buttonDelete.forEach(button => {
        button.addEventListener("click", () => {
            const isConfirm = confirm("Bạn có chắc chắn muốn xóa bình luận này?")

            if(isConfirm) {
                const id = button.getAttribute("data-id")

                const action = path + `/${id}?_method=DELETE`
                formDeleteItem.action = action
            
                formDeleteItem.submit()
            }
        })
    })
}

// Multi-select functionality
const checkboxes = document.querySelectorAll('input[name="id"]')
const checkAllBox = document.querySelector('input[name="checkall"]')
const countChecked = document.querySelector('#count-checked')
if (checkAllBox && checkboxes.length > 0) {
    // Check all functionality
    checkAllBox.addEventListener('change', function() {
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked
        })
        updateCheckCount()
    })

    // Individual checkbox change
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateCheckCount()
            
            // Update "check all" status
            const checkedBoxes = document.querySelectorAll('input[name="id"]:checked')
            checkAllBox.checked = checkedBoxes.length === checkboxes.length
        })
    })
}

function updateCheckCount() {
    const checkedBoxes = document.querySelectorAll('input[name="id"]:checked')
    if (countChecked) {
        countChecked.textContent = checkedBoxes.length
    }
}

// Multi-change form
const formChangeMulti = document.querySelector('#form-change-multi')
if (formChangeMulti) {
    formChangeMulti.addEventListener('submit', function(e) {
        e.preventDefault()
        
        const checkedBoxes = document.querySelectorAll('input[name="id"]:checked')
        if (checkedBoxes.length === 0) {
            alert('Vui lòng chọn ít nhất một bình luận!')
            return
        }
        
        const type = this.querySelector('select[name="type"]').value
        if (!type) {
            alert('Vui lòng chọn hành động!')
            return
        }
        
        const ids = Array.from(checkedBoxes).map(cb => cb.value).join(', ')
        
        // Create hidden input for ids
        let idsInput = this.querySelector('input[name="ids"]')
        if (!idsInput) {
            idsInput = document.createElement('input')
            idsInput.type = 'hidden'
            idsInput.name = 'ids'
            this.appendChild(idsInput)
        }
        idsInput.value = ids
        
        // Confirm action
        let confirmMessage = `Bạn có chắc muốn ${type === 'active' ? 'kích hoạt' : type === 'inactive' ? 'ẩn' : 'xóa'} ${checkedBoxes.length} bình luận?`
        if (confirm(confirmMessage)) {
            this.submit()
        }
    })
}
