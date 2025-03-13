module.exports = (objectPangination, query, countProducts) => {
    if(query.page) {
        objectPangination.currentPage = parseInt(query.page)
    }

    objectPangination.skip = (objectPangination.currentPage - 1) * objectPangination.limitItems

    
    const totalPage = Math.ceil(countProducts / objectPangination.limitItems)
    objectPangination.totalPage = totalPage

    return objectPangination
}