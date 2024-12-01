const User = require('../models/User');

exports.addContact = async (req, res) => {
    try {
        const { name, phone, relationship } = req.body;
        const user = await User.findById(req.user.id);

        user.emergencyContacts.push({ name, phone, relationship });
        await user.save();

        res.status(201).json(user.emergencyContacts);
    } catch (err) {
        res.status(500).json({ message: 'Error adding contact', error: err.message });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user.emergencyContacts);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching contacts', error: err.message });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.emergencyContacts = user.emergencyContacts.filter(
            contact => contact._id.toString() !== req.params.id
        );
        await user.save();
        res.json(user.emergencyContacts);
    } catch (err) {
        res.status(500).json({ message: 'Error deleting contact', error: err.message });
    }
};

exports.updateContact = async (req, res) => {
    try {
        const { name, phone, relationship } = req.body;
        const user = await User.findById(req.user.id);
        
        const contactIndex = user.emergencyContacts.findIndex(
            contact => contact._id.toString() === req.params.id
        );

        if (contactIndex === -1) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        user.emergencyContacts[contactIndex] = {
            ...user.emergencyContacts[contactIndex],
            name: name || user.emergencyContacts[contactIndex].name,
            phone: phone || user.emergencyContacts[contactIndex].phone,
            relationship: relationship || user.emergencyContacts[contactIndex].relationship
        };

        await user.save();
        res.json(user.emergencyContacts);
    } catch (err) {
        res.status(500).json({ message: 'Error updating contact', error: err.message });
    }
};
