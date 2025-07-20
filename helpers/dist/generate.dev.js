"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateRamdomString = generateRamdomString;
exports.generateRamdomNumber = generateRamdomNumber;

function generateRamdomString(length) {
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';

  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

function generateRamdomNumber(length) {
  var characters = '1234567890';
  var result = '';

  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}