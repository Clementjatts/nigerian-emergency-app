const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['MEDICAL', 'POLICE', 'FIRE', 'ACCIDENT']
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'RESOLVED', 'CANCELLED'],
        default: 'PENDING'
    },
    description: String,
    contactsNotified: [{
        contactId: String,
        notifiedAt: Date,
        status: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

emergencySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Emergency', emergencySchema);
