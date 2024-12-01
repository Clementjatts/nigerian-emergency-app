const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    addContact,
    getContacts,
    deleteContact,
    updateContact
} = require('../controllers/contactController');

// Get all contacts
router.get('/', auth, getContacts);

// Add new contact
router.post('/', auth, addContact);

// Update contact
router.put('/:id', auth, updateContact);

// Delete contact
router.delete('/:id', auth, deleteContact);

module.exports = router;
