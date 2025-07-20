const formatCurrency = (num) => {
    if (num === undefined || num === null || num === '') {
        return '0 đ';
    }
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) {
        return '0 đ';
    }
    
    return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
}

export default formatCurrency;