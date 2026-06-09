const express = require('express');
const { getMe, handle42OAuthCallback } = require('../controllers/authController');

const router = express.Router();

router.get('/me', getMe);
router.post('/oauth/42/callback', handle42OAuthCallback);

module.exports = router;
