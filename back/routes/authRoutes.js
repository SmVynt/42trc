const express = require('express');
const { requestLogin, confirmLogin } = require('../controllers/authController');

const router = express.Router();

router.post('/login/request', requestLogin);
router.post('/login/confirm', confirmLogin);

module.exports = router;
