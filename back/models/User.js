const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
	name: { type: String, required: true },
	type: { type: String, default: 'misc' },
	description: { type: String },
	image: { type: String },
	quantity: { type: Number, default: 1 },
	metadata: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const UserSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true, index: true },
	intra: { type: String },
	email: { type: String },
	passwordHash: { type: String },
	inventory: { type: [InventoryItemSchema], default: [] },
	stats: {
		gamesPlayed: { type: Number, default: 0 },
		wins: { type: Number, default: 0 },
		points: { type: Number, default: 0 }
	}
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
module.exports = User;
