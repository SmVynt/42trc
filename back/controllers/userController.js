const User = require('../models/User');
const Item = require('../models/Item');

// Helper function to build user response with populated inventory items
const buildUserResponse = async (user) => {
	if (!user) return null;

	// Convert to a plain object if it's a Mongoose document.
	// If it has a toObject method, it converts the document into a plain JavaScript object.
	// ... is being used to spread oparator. Field by field.
	const plainUser = typeof user.toObject === 'function' ? user.toObject() : { ...user };
	// Ensure inventory is an array and extract unique itemIds
	const inventory = Array.isArray(plainUser.inventory) ? plainUser.inventory : [];
	// This builds a unique list of item IDs from the inventory.
	// It filters out any falsy values (like null or undefined) to avoid unnecessary database queries.
	const itemIds = [...new Set(inventory.map((entry) => entry.itemId).filter(Boolean))];

	if (!itemIds.length) {
		return { ...plainUser, inventory: [] };
	}

	const items = await Item.find({ id: { $in: itemIds } }).lean();
	const itemsById = new Map(items.map((item) => [item.id, item]));

	return {
		...plainUser,
		inventory: inventory.map((entry) => ({
			...entry,
			item: itemsById.get(entry.itemId) || null,
		})),
	};
};

// List all active items in the catalog, sorted by category, price, and name.
const listItems = async (req, res) => {
	try {
		const items = await Item.sort({ category: 1, price: 1, name: 1 }).lean();
		return res.status(200).json({ items });
	} catch (error) {
		console.error('listItems failed', error);
		return res.status(500).json({ message: 'Could not load item catalog.' });
	}
};

// Register a new user
const registerUser = async (req, res) => {
	try {
		const { username, email, intra} = req.body;

		if (!username) {
			return res.status(400).json({ message: 'username is required.' });
		}

		const existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(409).json({ message: 'Username already exists.' });
		}

		const createdUser = await User.create({
			username,
			email,
			intra
		});

		return res.status(201).json({ user: await buildUserResponse(createdUser) });
	} catch (error) {
		console.error('registerUser failed', error);
		return res.status(500).json({ message: 'Could not register user.' });
	}
};

// Get user details by username
const getUser = async (req, res) => {
	try {
		const { username } = req.params;
		const user = await User.findOne({ username }).lean();

		if (!user) {
			return res.status(404).json({ message: 'User not found.' });
		}

		return res.status(200).json({ user: await buildUserResponse(user) });
	} catch (error) {
		console.error('getUser failed', error);
		return res.status(500).json({ message: 'Could not load user.' });
	}
};

const addItemToUser = async (req, res) => {
	try {
		const { username } = req.params;
		const { itemId, quantity = 1, equipped = false } = req.body;

		if (!itemId) {
			return res.status(400).json({ message: 'itemId is required.' });
		}

		const parsedQuantity = Number(quantity);
		if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
			return res.status(400).json({ message: 'quantity must be a positive integer.' });
		}

		const [user, item] = await Promise.all([
			User.findOne({ username }),
			Item.findOne({ id: itemId }),
		]);

		if (!user) {
			return res.status(404).json({ message: 'User not found.' });
		}

		if (!item) {
			return res.status(404).json({ message: 'Item not found.' });
		}

		const existingEntry = user.inventory.find((entry) => entry.itemId === itemId);
		if (item.permanent && existingEntry) {
			return res.status(409).json({ message: 'This item can only be purchased once.' });
		}

		if (existingEntry) {
			existingEntry.quantity += parsedQuantity;
			existingEntry.equipped = equipped || existingEntry.equipped;
		} else {
			user.inventory.push({
				itemId,
				quantity: parsedQuantity,
				equipped,
				pricePaid: item.price,
				metadata: {
					name: item.name,
					category: item.category,
					modelUrl: item.modelUrl,
					rarity: item.rarity,
				},
			});
		}

		await user.save();

		return res.status(200).json({ user: await buildUserResponse(user), item });
	} catch (error) {
		console.error('addItemToUser failed', error);
		return res.status(500).json({ message: 'Could not add item to user.' });
	}
};

module.exports = {
	registerUser,
	getUser,
	addItemToUser,
	listItems,
};
