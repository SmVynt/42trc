const mongoose = require('mongoose');

const RewardGrantSchema = new mongoose.Schema({
	username: { type: String, required: true, index: true },
	rewardKey: { type: String, required: true, index: true },
	rewardType: { type: String, required: true, enum: ['coins', 'item'], index: true },
	coinsGranted: { type: Number, default: 0 },
	itemId: { type: String, index: true },
	referenceId: { type: String, index: true },
	claimedAt: { type: Date, default: Date.now },
	metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

RewardGrantSchema.index({ username: 1, rewardKey: 1 }, { unique: true });

const RewardGrant = mongoose.model('RewardGrant', RewardGrantSchema);
module.exports = RewardGrant;