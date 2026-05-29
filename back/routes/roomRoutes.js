const express = require('express');
//get all controllers

const createRoom = require('../controllers/createRoomController');
const joinRoom = require('../controllers/joinRoomController');
const completeTask = require('../controllers/comlpeteTaskController');
const getLeaderboard = require('../controllers/getRoomLeaderboardController');
const getParticipantsList = require('../controllers/getParticipantsListController');
const {verifyUser} = require('../controllers/verifyUserController');
const {closeRoom} = require('../controllers/closeMyRoomController');

const router = express.Router();

router.post('/create',createRoom); // POST /api/rooms/create
router.post('/join',joinRoom); // POST /api/rooms/join
router.post('/complete',completeTask); // POST /api/rooms/:id/task/complete
router.post('/leaderboard',getLeaderboard); // POST /api/rooms/:id/leaderboard
router.post('/participants',getParticipantsList); // POST /api/rooms/participants
router.post('/verify', verifyUser);
router.post('/close', closeRoom);



module.exports = router;