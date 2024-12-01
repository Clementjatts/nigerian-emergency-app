const Emergency = require('../models/Emergency');
const { EMERGENCY_TYPES, EMERGENCY_STATUS } = require('../config/config');

exports.createEmergency = async (req, res) => {
    try {
        const { type, location, description } = req.body;

        if (!EMERGENCY_TYPES.includes(type)) {
            return res.status(400).json({ message: 'Invalid emergency type' });
        }

        const emergency = new Emergency({
            user: req.user.id,
            type,
            location,
            description,
            status: 'PENDING'
        });

        await emergency.save();
        res.status(201).json(emergency);
    } catch (err) {
        res.status(500).json({ message: 'Error creating emergency', error: err.message });
    }
};

exports.getUserEmergencies = async (req, res) => {
    try {
        const emergencies = await Emergency.find({ user: req.user.id })
            .sort({ createdAt: -1 });
        res.json(emergencies);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching emergencies', error: err.message });
    }
};

exports.updateEmergencyStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!EMERGENCY_STATUS.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const emergency = await Emergency.findById(id);
        
        if (!emergency) {
            return res.status(404).json({ message: 'Emergency not found' });
        }

        if (emergency.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        emergency.status = status;
        await emergency.save();

        res.json(emergency);
    } catch (err) {
        res.status(500).json({ message: 'Error updating emergency', error: err.message });
    }
};
