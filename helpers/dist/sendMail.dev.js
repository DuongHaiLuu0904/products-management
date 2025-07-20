"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sendMail = sendMail;

var _nodemailer = require("nodemailer");

function sendMail(email, subject, html) {
  var transporter, mailOptions;
  return regeneratorRuntime.async(function sendMail$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          transporter = (0, _nodemailer.createTransport)({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });
          mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: html
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });

        case 3:
        case "end":
          return _context.stop();
      }
    }
  });
}