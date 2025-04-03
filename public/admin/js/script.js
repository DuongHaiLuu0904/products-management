// Button-Status
const buttonStatus = document.querySelectorAll("[button-status]")
if(buttonStatus.length > 0) {
    let url = new URL(window.location.href)

    buttonStatus.forEach(button => {
        button.addEventListener("click", () => {
            const status = button.getAttribute("button-status")
            
            if(status) {
                url.searchParams.set("status", status)
            } else {
                url.searchParams.delete("status")
            }

            window.location.href = url.href
        })
    })
}

// Form Search
const FormSearch = document.querySelector("#form-search")
if(FormSearch) {
    let url = new URL(window.location.href)

    FormSearch.addEventListener("submit", (e) => {
        e.preventDefault()
        const keyword = e.target.elements.keyword.value

        if(keyword) {
            url.searchParams.set("keyword", keyword)
        } else {
            url.searchParams.delete("keyword")
        }

        window.location.href = url.href
    })
}

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

// Checkbox Multi
const checkboxMulti = document.querySelector("[checkbox-multi]")
if(checkboxMulti) {
    const inputCheckAll = checkboxMulti.querySelector("input[name='checkall']")
    const inputsId = checkboxMulti.querySelectorAll("input[name='id']")

    inputCheckAll.addEventListener("click", () => {       
        if(inputCheckAll.checked) {
            inputsId.forEach(input => {
                input.checked = true
            })
        } else {
            inputsId.forEach(input => {
                input.checked = false
            })
        }
    })

    inputsId.forEach(input => {
        input.addEventListener("click", () => {
            const countChecked = checkboxMulti.querySelectorAll(
                "input[name='id']:checked"
            ).length

            console.log(countChecked)
            if(countChecked == inputsId.length) {
                inputCheckAll.checked = true
            } else {
                inputCheckAll.checked = false
            }
        })
    })
}


// Form change multi
const formChangeMulti = document.querySelector("[form-change-multi]")
if(formChangeMulti) {
    formChangeMulti.addEventListener("submit", (e) => {
        e.preventDefault()

        const checkboxMulti = document.querySelector("[checkbox-multi]")
        const inputChecked = checkboxMulti.querySelectorAll(
            "input[name='id']:checked"
        )

        const typeChange = e.target.elements.type.value
        if(typeChange == "delete-all") {
            const isConfirm = confirm("Bạn có chắc chắn muốn xóa sản phẩm này")
            if(!isConfirm) {
                return;
            }
        }

        if(inputChecked.length > 0) {
            let ids = []
            const inputIds = formChangeMulti.querySelector("input[name='ids']")

            inputChecked.forEach(input => {
                const id = input.value

                if(typeChange == "change-position") {
                    const position = input.closest("tr").querySelector("input[name='position']").value

                    ids.push(`${id}-${position}`)
                } else {
                    ids.push(id)
                }
            })

            inputIds.value = ids.join(", ")

            formChangeMulti.submit()
        } else {
            alert("NOoooo")
        }
    })
}
// End Form change multi


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
                console.log("Đã xóa ảnh")
            }
        })
    }
}
// End Upload Image

// sort
const sort = document.querySelector("[sort]")
if(sort) {
    let url = new URL(window.location.href)

    const sortSelect = sort.querySelector("select")
    const sortClear = sort.querySelector("[sort-clear]")

    sortSelect.addEventListener("change", () => {
        const value = sortSelect.value
        const [sortKey, sortValue] = value.split("-")

        url.searchParams.set("sortKey", sortKey)
        url.searchParams.set("sortValue", sortValue)

        window.location.href = url.href
    })

    sortClear.addEventListener("click", () => {
        url.searchParams.delete("sortKey")
        url.searchParams.delete("sortValue")

        window.location.href = url.href
    })

    const sortKey = url.searchParams.get("sortKey")
    const sortValue = url.searchParams.get("sortValue")

    if(sortKey && sortValue) {
        const stringvalue = `${sortKey}-${sortValue}`

        const optionSelected = sortSelect.querySelector(`option[value='${stringvalue}']`)
        optionSelected.selected = true
    }
}
// End sort

// Standalone Sidebar Toggle Function
function toggleSidebar() {
    const sider = document.querySelector('.sider');
    const main = document.querySelector('.main');
    
    if(sider && main) {
        sider.classList.toggle('collapsed');
        main.classList.toggle('expanded');
        
        localStorage.setItem('sidebarCollapsed', sider.classList.contains('collapsed'));
        console.log("Sidebar toggled via direct function");
    } else {
        console.error("Sidebar elements not found in toggle function");
    }
}

// Sidebar Toggle
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleSidebar') || document.querySelector('.sidebar-toggle button');
    const sider = document.querySelector('.sider');
    const main = document.querySelector('.main');
    
    if(toggleBtn && sider && main) {
        const sidebarState = localStorage.getItem('sidebarCollapsed');
        
        if (sidebarState === 'true') {
            sider.classList.add('collapsed');
            main.classList.add('expanded');
        }
        
        toggleBtn.addEventListener('click', function() {
            toggleSidebar();
        });
        
        console.log("Sidebar toggle initialized successfully");
    } else {
        console.error("Sidebar elements not found:", {
            toggleBtn: !!toggleBtn,
            sider: !!sider,
            main: !!main
        });
    }
});
// End Sidebar Toggle
