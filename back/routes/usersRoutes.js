const express = require('express');
const { getLevels } = require('../controllers/usersController');

const router = express.Router();

router.get('/levels', getLevels);

module.exports = router;
