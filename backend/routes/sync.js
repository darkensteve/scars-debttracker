const express = require('express');
const Contact = require('../models/Contact');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

function mapContact(c) {
  return {
    id: c._id.toString(),
    name: c.name,
    phone: c.phone || '',
    notes: c.notes || '',
    photoUri: c.photoUri || null,
    createdAt: c.createdAt?.toISOString?.() || c.createdAt,
  };
}

function mapTransaction(t) {
  return {
    id: t._id.toString(),
    contactId: t.contactId?.toString?.() || String(t.contactId),
    amount: t.amount,
    type: t.type,
    description: t.description || '',
    date: t.date?.toISOString?.() || t.date,
    dueDate: t.dueDate || null,
  };
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('settings name email');
    const contacts = await Contact.find({ userId: req.userId }).sort({ createdAt: -1 });
    const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });

    res.json({
      settings: {
        businessName: user?.settings?.businessName || 'SCARS',
        currency: user?.settings?.currency || '₱',
      },
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      contacts: contacts.map(mapContact),
      transactions: transactions.map(mapTransaction),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const { businessName, currency } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (businessName !== undefined) user.settings.businessName = businessName;
    if (currency !== undefined) user.settings.currency = currency;
    await user.save();

    res.json({
      settings: {
        businessName: user.settings.businessName,
        currency: user.settings.currency,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/import', authMiddleware, async (req, res) => {
  try {
    const existing = await Contact.countDocuments({ userId: req.userId });
    if (existing > 0) {
      return res.status(400).json({ message: 'Account already has data' });
    }

    const { contacts = [], transactions = [], settings: incomingSettings } = req.body;
    const idMap = new Map();

    for (const c of contacts) {
      const doc = await Contact.create({
        userId: req.userId,
        name: c.name,
        phone: c.phone || '',
        notes: c.notes || '',
        photoUri: c.photoUri || null,
      });
      idMap.set(c.id, doc._id.toString());
    }

    for (const t of transactions) {
      const mappedContactId = idMap.get(t.contactId);
      if (!mappedContactId) continue;
      await Transaction.create({
        userId: req.userId,
        contactId: mappedContactId,
        amount: t.amount,
        type: t.type,
        description: t.description || '',
        date: t.date ? new Date(t.date) : new Date(),
        dueDate: t.dueDate || null,
      });
    }

    if (incomingSettings) {
      const user = await User.findById(req.userId);
      if (incomingSettings.businessName) user.settings.businessName = incomingSettings.businessName;
      if (incomingSettings.currency) user.settings.currency = incomingSettings.currency;
      await user.save();
    }

    const user = await User.findById(req.userId);
    const savedContacts = await Contact.find({ userId: req.userId });
    const savedTransactions = await Transaction.find({ userId: req.userId });

    res.json({
      settings: {
        businessName: user.settings.businessName,
        currency: user.settings.currency,
      },
      contacts: savedContacts.map(mapContact),
      transactions: savedTransactions.map(mapTransaction),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
