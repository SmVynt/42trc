const express = require('express');
const router = express.Router();
const { registerUser, getUser, addItemToUser, listItems } = require('../controllers/userController');

// items listing (template items)
router.get('/items', listItems);

// register new user
router.post('/register', registerUser);

// add item to user's inventory
router.post('/:username/items', addItemToUser);

// get user by username
router.get('/:username', getUser);

module.exports = router;
