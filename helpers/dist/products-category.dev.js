"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSubCategory = getSubCategory;

var _productCategoryModel = _interopRequireDefault(require("../models/product-category.model.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function getSubCategory(parentId) {
  var getCategory, listCategory;
  return regeneratorRuntime.async(function getSubCategory$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          getCategory = function getCategory(parentId) {
            var subs, allSub, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, sub, childs;

            return regeneratorRuntime.async(function getCategory$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.next = 2;
                    return regeneratorRuntime.awrap(_productCategoryModel["default"].find({
                      deleted: false,
                      status: 'active',
                      parent_id: parentId
                    }));

                  case 2:
                    subs = _context.sent;
                    allSub = _toConsumableArray(subs);
                    _iteratorNormalCompletion = true;
                    _didIteratorError = false;
                    _iteratorError = undefined;
                    _context.prev = 7;
                    _iterator = subs[Symbol.iterator]();

                  case 9:
                    if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                      _context.next = 18;
                      break;
                    }

                    sub = _step.value;
                    _context.next = 13;
                    return regeneratorRuntime.awrap(getCategory(sub.id));

                  case 13:
                    childs = _context.sent;
                    allSub = allSub.concat(childs);

                  case 15:
                    _iteratorNormalCompletion = true;
                    _context.next = 9;
                    break;

                  case 18:
                    _context.next = 24;
                    break;

                  case 20:
                    _context.prev = 20;
                    _context.t0 = _context["catch"](7);
                    _didIteratorError = true;
                    _iteratorError = _context.t0;

                  case 24:
                    _context.prev = 24;
                    _context.prev = 25;

                    if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                      _iterator["return"]();
                    }

                  case 27:
                    _context.prev = 27;

                    if (!_didIteratorError) {
                      _context.next = 30;
                      break;
                    }

                    throw _iteratorError;

                  case 30:
                    return _context.finish(27);

                  case 31:
                    return _context.finish(24);

                  case 32:
                    return _context.abrupt("return", allSub);

                  case 33:
                  case "end":
                    return _context.stop();
                }
              }
            }, null, null, [[7, 20, 24, 32], [25,, 27, 31]]);
          };

          _context2.next = 3;
          return regeneratorRuntime.awrap(getCategory(parentId));

        case 3:
          listCategory = _context2.sent;
          return _context2.abrupt("return", listCategory);

        case 5:
        case "end":
          return _context2.stop();
      }
    }
  });
}