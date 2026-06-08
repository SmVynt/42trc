const express = require('express');
const { requestLogin, confirmLogin, getMe } = require('../controllers/authController');

const router = express.Router();

router.post('/login/request', requestLogin);
router.post('/login/confirm', confirmLogin);
router.get('/me', getMe);

module.exports = router;
