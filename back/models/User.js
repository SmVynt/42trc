const mongoose = require('mongoose');
const { ItemCategory } = require('./Item');

const InventoryItemSchema = new mongoose.Schema({
	itemId: { type: String, required: true, index: true },
	quantity: { type: Number, default: 1 },
	equipped: { type: Boolean, default: false },
	// Additional metadata can be stored here, that's not explicitly defined.
	metadata: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const UserSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true, index: true },
	intra: { type: String },
	email: { type: String, unique: true, sparse: true, index: true },
	emailVerifiedAt: { type: Date },
	lastLoginAt: { type: Date },
	inventory: { type: [InventoryItemSchema], default: [] },
	coins: { type: Number, default: 0 },
	equippedItems: { type: mongoose.Schema.Types.Mixed, default: {} },

// Additional metadata can be stored here, that's not explicitly defined.
	metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
module.exports = User;
