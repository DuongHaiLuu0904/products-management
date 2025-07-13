const express = require('express');
const router = express.Router();

const controller = require('../../controllers/clients/token.controller');

router.post('/refresh', controller.refreshToken);
router.get('/status', controller.checkStatus);

module.exports = router;
