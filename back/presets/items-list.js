// const ItemCategory = Object.freeze({
// 	HAT:		'hat',
// 	TSHIRT:		'tshirt',
// 	BOOTS:		'boots',
// 	PANTS:		'pants',
// 	HAND:		'hand',
// 	ACCESSORY:	'accessory',
// 	MISC:		'misc'
// });

// const ItemSchema = new mongoose.Schema({
// 	id: { type: String, required: true, unique: true, index: true },
// 	name: { type: String, required: true, index: true },
// 	category: { type: String, enum: Object.values(ItemCategory), default: ItemCategory.MISC, index: true },

// 	permanent: { type: Boolean, default: true },
// 	price: { type: Number, required: true, min: 0 },

// 	modelUrl: { type: String },
// 	description: { type: String, default: '' },
// 	// Additional metadata can be stored here, that's not explicitly defined.
// 	metadata: { type: mongoose.Schema.Types.Mixed }
// }, { timestamps: true });
const allItems = [
	// HATS
    {points: 1, pack: 1, taskId: 72,
        description: "Ein anderer Spieler muss eine Karte oder Zeichnung erstellen, die den Standort eines bestimmten Gegenstandes oder Objekts zeigt."},
    {points: 1, pack: 1, taskId: 73,
        description: "Bitte einen anderen Spieler, dir ein Gericht ohne eine Zutat zuzubereiten, ohne diese Zutat oder den Typ dieser Zutat zu nennen."}
    // PACK 2
];

module.exports = allItems;
