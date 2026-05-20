const express = require('express');
const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Add transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { contactId, amount, type, description } = req.body;

    // Create transaction
    const transaction = new Transaction({
      userId: req.userId,
      contactId,
      amount,
      type,
      description,
    });

    await transaction.save();

    // Update contact balance
    let contact = await Contact.findById(contactId);
    if (type === 'loan' || type === 'purchase') {
      contact.balance += amount;
    } else if (type === 'payment') {
      contact.balance -= amount;
    }
    contact.updatedAt = Date.now();
    await contact.save();

    res.status(201).json({
      message: 'Transaction added successfully',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .populate('contactId')
      .sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get transaction by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('contactId');

    if (!transaction || transaction.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update transaction
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { amount, type, description } = req.body;
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.amount = amount || transaction.amount;
    transaction.type = type || transaction.type;
    transaction.description = description || transaction.description;

    await transaction.save();

    res.json({
      message: 'Transaction updated successfully',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete transaction
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.userId.toString() !== req.userId) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await Transaction.findByIdAndRemove(req.params.id);

    // Update contact balance
    let contact = await Contact.findById(transaction.contactId);
    if (transaction.type === 'loan' || transaction.type === 'purchase') {
      contact.balance -= transaction.amount;
    } else if (transaction.type === 'payment') {
      contact.balance += transaction.amount;
    }
    await contact.save();

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
