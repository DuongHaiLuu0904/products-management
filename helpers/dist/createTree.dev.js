"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createTree = createTree;
var count = 0;

function create(arr) {
  var parentId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  var tree = [];
  arr.forEach(function (item) {
    if (item.parent_id == parentId) {
      count++;
      var newItem = item;
      newItem.index = count;
      var children = create(arr, item.id);

      if (children.length > 0) {
        newItem.children = children;
      }

      tree.push(newItem);
    }
  });
  return tree;
}

function createTree(arr) {
  var parentId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
  count = 0;
  var tree = create(arr, parentId = "");
  return tree;
}