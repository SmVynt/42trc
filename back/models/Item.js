const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    type: { type: String, default: 'misc' },
    description: { type: String },
    image: { type: String },
    rarity: { type: String, default: 'common' },
    attributes: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

const Item = mongoose.model('Item', ItemSchema);
module.exports = Item;
