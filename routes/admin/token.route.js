const express = require('express');
const router = express.Router();

const controller = require('../../controllers/admin/token.controller');

router.post('/refresh', controller.refreshToken);
router.get('/status', controller.checkStatus);

module.exports = router;
