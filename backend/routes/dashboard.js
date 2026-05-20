const express = require('express');
const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get dashboard data
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get all contacts with their balances
    const contacts = await Contact.find({ userId: req.userId });

    // Calculate total debt
    const totalDebt = contacts.reduce((sum, contact) => sum + contact.balance, 0);

    // Get recent transactions
    const transactions = await Transaction.find({ userId: req.userId })
      .populate('contactId')
      .sort({ date: -1 })
      .limit(10);

    res.json({
      totalDebt,
      contactsCount: contacts.length,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
