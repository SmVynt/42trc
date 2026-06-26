const mongoose = require('mongoose');

const ItemCategory = Object.freeze({
	HAT:		'hat',
	TSHIRT:		'tshirt',
	BOOTS:		'boots',
	PANTS:		'pants',
	HAND:		'hand',
	ACCESSORY:	'accessory',
	MISC:		'misc'
});

const ItemSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    category: { type: String, enum: Object.values(ItemCategory), default: ItemCategory.MISC, index: true },

    permanent: { type: Boolean, default: true },
    price: { type: Number, required: true, min: 0 },

    modelUrl: { type: String },
    description: { type: String, default: '' },
	// Additional metadata can be stored here, that's not explicitly defined.
    metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const Item = mongoose.model('Item', ItemSchema);
module.exports = Item;
module.exports.ItemCategory = ItemCategory;
