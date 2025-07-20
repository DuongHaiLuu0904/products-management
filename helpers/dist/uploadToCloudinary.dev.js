"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.uploadToCloudinary = void 0;

var _cloudinary = require("cloudinary");

var _streamifier = require("streamifier");

_cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

var streamUpload = function streamUpload(buffer) {
  return new Promise(function (resolve, reject) {
    var stream = _cloudinary.v2.uploader.upload_stream(function (error, result) {
      if (result) {
        resolve(result);
      } else {
        reject(error);
      }
    });

    (0, _streamifier.createReadStream)(buffer).pipe(stream);
  });
};

var uploadToCloudinary = function uploadToCloudinary(buffer) {
  var result;
  return regeneratorRuntime.async(function uploadToCloudinary$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(streamUpload(buffer));

        case 2:
          result = _context.sent;
          return _context.abrupt("return", {
            url: result.url,
            public_id: result.public_id
          });

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
};

exports.uploadToCloudinary = uploadToCloudinary;

var deleteFromCloudinary = function deleteFromCloudinary(publicId) {
  var result;
  return regeneratorRuntime.async(function deleteFromCloudinary$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;

          if (publicId) {
            _context2.next = 3;
            break;
          }

          return _context2.abrupt("return", null);

        case 3:
          _context2.next = 5;
          return regeneratorRuntime.awrap(_cloudinary.v2.uploader.destroy(publicId));

        case 5:
          result = _context2.sent;
          return _context2.abrupt("return", result);

        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2["catch"](0);
          console.log("Error deleting image from Cloudinary:", _context2.t0);
          return _context2.abrupt("return", null);

        case 13:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 9]]);
};

var _default = {
  uploadToCloudinary: uploadToCloudinary,
  deleteFromCloudinary: deleteFromCloudinary
};
exports["default"] = _default;