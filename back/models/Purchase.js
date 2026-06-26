const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
	username: { type: String, required: true, index: true },
	itemId: { type: String, required: true, index: true },
	quantity: { type: Number, default: 1, min: 1 },
	unitPrice: { type: Number, required: true, min: 0 },
	totalPrice: { type: Number, required: true, min: 0 },
	status: { type: String, default: 'completed', enum: ['completed', 'refunded', 'failed'], index: true },
}, { timestamps: true });

PurchaseSchema.index({ username: 1, itemId: 1, referenceId: 1 }, { unique: true, sparse: true });

const Purchase = mongoose.model('Purchase', PurchaseSchema);
module.exports = Purchase;
