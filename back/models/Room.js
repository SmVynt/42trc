const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    username: { type: String, required: true },
    tasks: { type: Array, default: [] },
    role: { type: String, default: 'player' },
    points: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const RoomSchema = new mongoose.Schema({
    roomname: { type: String, required: true, unique: true, index: true },
    participants: { type: [ParticipantSchema], default: [] },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    isInPlay: { type: Boolean, default: false },
    tasks: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.model('Room', RoomSchema);
module.exports = Room;
