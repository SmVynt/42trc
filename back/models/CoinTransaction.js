const mongoose = require('mongoose');

const CoinTransactionSchema = new mongoose.Schema({
	username: { type: String, required: true, index: true },
	amount: { type: Number, required: true },
	source: { type: String, required: true, enum: ['game_purchase', 'school_reward', 'admin_adjustment'], index: true },
	referenceId: { type: String, index: true },
	description: { type: String, default: '' },
	balanceAfter: { type: Number },
	metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

CoinTransactionSchema.index({ username: 1, source: 1, referenceId: 1 }, { unique: true, sparse: true });

const CoinTransaction = mongoose.model('CoinTransaction', CoinTransactionSchema);
module.exports = CoinTransaction;