"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _default = function _default(query) {
  var filterStatus = [{
    name: "Tất cả",
    status: "",
    "class": ""
  }, {
    name: "Hoạt động",
    status: "active",
    "class": ""
  }, {
    name: "Dừng hoạt động",
    status: "inactive",
    "class": ""
  }];

  if (query.status) {
    var index = filterStatus.findIndex(function (item) {
      return item.status == query.status;
    });
    filterStatus[index]["class"] = "active";
  } else {
    var _index = filterStatus.findIndex(function (item) {
      return item.status == "";
    });

    filterStatus[_index]["class"] = "active";
  }

  return filterStatus;
};

exports["default"] = _default;