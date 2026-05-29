const User = require('../models/User');
const Item = require('../models/Item');

const registerUser = async (req, res) => {
    const { username, intra, email } = req.body;
    if (!username) return res.status(400).json({ message: 'username required' });
    try {
        let user = await User.findOne({ username });
        if (user) return res.status(409).json({ message: 'username exists' });
        user = new User({ username, intra, email });
        await user.save();
        return res.status(201).json({ user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'failed to create user', err });
    }
};

const getUser = async (req, res) => {
    const username = req.params.username;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'user not found' });
        return res.json({ user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'failed to fetch user', err });
    }
};

const addItemToUser = async (req, res) => {
    const username = req.params.username;
    const { itemId, item, quantity = 1, metadata = {} } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'user not found' });

        let itemData;
        if (itemId) {
            itemData = await Item.findById(itemId).lean();
            if (!itemData) return res.status(404).json({ message: 'item template not found' });
        } else if (item) {
            itemData = item;
        } else {
            return res.status(400).json({ message: 'item or itemId required' });
        }

        user.inventory.push({
            name: itemData.name,
            type: itemData.type,
            description: itemData.description,
            image: itemData.image,
            quantity,
            metadata
        });

        await user.save();
        return res.status(200).json({ inventory: user.inventory });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'failed to add item', err });
    }
};

const listItems = async (req, res) => {
    try {
        const items = await Item.find();
        return res.json({ items });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'failed to list items', err });
    }
};

module.exports = { registerUser, getUser, addItemToUser, listItems };
