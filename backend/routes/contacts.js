const express = require('express');
const Contact = require('../models/Contact');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Create contact
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, notes, photoUri } = req.body;

    const contact = new Contact({
      userId: req.userId,
      name,
      phone,
      email,
      notes: notes || '',
      photoUri: photoUri || null,
    });

    await contact.save();

    res.status(201).json({
      message: 'Contact created successfully',
      contact,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all contacts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get contact by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact || contact.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update contact
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, phone, email, notes, photoUri } = req.body;
    let contact = await Contact.findById(req.params.id);

    if (!contact || contact.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    if (name !== undefined) contact.name = name;
    if (phone !== undefined) contact.phone = phone;
    if (email !== undefined) contact.email = email;
    if (notes !== undefined) contact.notes = notes;
    if (photoUri !== undefined) contact.photoUri = photoUri;
    contact.updatedAt = Date.now();

    await contact.save();

    res.json({
      message: 'Contact updated successfully',
      contact,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete contact
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact || contact.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    await Contact.findByIdAndDelete(req.params.id);
    await Transaction.deleteMany({ contactId: req.params.id, userId: req.userId });

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
