// update số lượng sp trong giỏ hàng
const inputsQuantity = document.querySelectorAll('input[name="quantity"]');
if(inputsQuantity.length > 0) {
    inputsQuantity.forEach(input => {
        input.addEventListener('change', (e) => {
            const product = input.getAttribute('product-id')

            const quantity = input.value
            if(quantity > 0) {
                window.location.href = `/cart/update/${product}/${quantity}`
            }
           
        })
    })
}