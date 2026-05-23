const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { normalizePhone, isValidPhone } = require('../lib/phoneUtils');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({
        message: 'A valid mobile number is required (e.g. 09171234567).',
      });
    }

    const normalizedPhone = normalizePhone(phone);

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const phoneTaken = await User.findOne({ phone: normalizedPhone });
    if (phoneTaken) {
      return res.status(400).json({ message: 'This phone number is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      name,
      email,
      password: hashedPassword,
      phone: normalizedPhone,
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify phone for PIN recovery (user must be signed in on this device)
router.post('/verify-pin-recovery', authMiddleware, async (req, res) => {
  try {
    const { phone, email } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (!user.phone) {
      return res.status(400).json({
        message:
          'No phone number on your account. Add your mobile number in Settings, or sign up with a phone number.',
      });
    }

    const submitted = normalizePhone(phone);
    if (!submitted || !isValidPhone(phone)) {
      return res.status(400).json({ message: 'Enter the mobile number on your account.' });
    }

    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      return res.status(400).json({ message: 'Email does not match this account.' });
    }

    if (submitted !== user.phone) {
      return res.status(400).json({
        message: 'Phone number does not match our records. Use the number from sign-up.',
      });
    }

    res.json({ verified: true, message: 'Verified. You can set a new PIN.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/phone', authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ message: 'Enter a valid mobile number (e.g. 09171234567).' });
    }

    const normalizedPhone = normalizePhone(phone);
    const taken = await User.findOne({
      phone: normalizedPhone,
      _id: { $ne: req.userId },
    });
    if (taken) {
      return res.status(400).json({ message: 'This phone number is already in use.' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { phone: normalizedPhone },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Phone number saved',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
