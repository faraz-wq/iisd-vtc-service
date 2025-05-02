const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Import the User model
require('dotenv').config();

const router = express.Router();
// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login a user and attach a JWT token as a cookie
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Attach the token to a cookie
    res.cookie('token', token, {
      httpOnly: true, // Prevents client-side JavaScript access
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      sameSite: 'strict', // Prevents cross-site requests
      maxAge: 24*36000000000000, 
      sameSite: 'lax',
    });


    res.json({ username: user.username, message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logout a user by clearing the JWT token cookie
router.get('/logout', (req, res) => {
  // Clear the token cookie
  res.clearCookie('token');

  res.json({ message: 'Logged out successfully' });
});

module.exports = router;