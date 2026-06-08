const express = require('express');
const { requestLogin, confirmLogin, getMe, handle42OAuthCallback } = require('../controllers/authController');

const router = express.Router();

router.post('/login/request', requestLogin);
router.post('/login/confirm', confirmLogin);
router.get('/me', getMe);
router.post('/oauth/42/callback', handle42OAuthCallback);

module.exports = router;
