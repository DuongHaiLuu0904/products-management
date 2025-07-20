"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _default = function _default(objectPangination, query, countProducts) {
  if (query.page) {
    objectPangination.currentPage = parseInt(query.page);
  }

  objectPangination.skip = (objectPangination.currentPage - 1) * objectPangination.limitItems;
  var totalPage = Math.ceil(countProducts / objectPangination.limitItems);
  objectPangination.totalPage = totalPage;
  return objectPangination;
};

exports["default"] = _default;