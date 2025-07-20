"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.priceNew = priceNew;
exports.priceNewProduct = priceNewProduct;

function priceNew(products) {
  var newProducts = products.map(function (item) {
    item.priceNew = (item.price * (100 - item.discountPercentage) / 100).toFixed(0);
    return item;
  });
  return newProducts;
}

function priceNewProduct(product) {
  var priceNew = (product.price * (100 - product.discountPercentage) / 100).toFixed(0);
  return priceNew;
}