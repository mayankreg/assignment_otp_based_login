const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/otp_DB', {
  useNewUrlParser: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpiration: {
    type: Date,
    default: null,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  blockedUntil: {
    type: Date,
    default: null,
  },
});

const User = mongoose.model('User', userSchema);

// Generate OTP API
app.post('/generate-otp', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if the user is blocked
    if (user.blockedUntil && user.blockedUntil > Date.now()) {
      return res.status(403).json({ error: 'Account blocked. Please try again later.' });
    }

    // Check if there is an existing valid OTP for the user
    if (user.otpExpiration && user.otpExpiration > Date.now()) {
      return res.status(400).json({ error: 'OTP already generated. Please wait for the current OTP to expire.' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user's OTP and OTP expiration
    user.otp = otp;
    user.otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // Valid for 5 minutes
    user.loginAttempts = 0; // Reset login attempts
    await user.save();

    res.json({ message: `OTP generated and sent successfully. ${otp}`});

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate OTP.' });
  }
});

// Login API
app.post('/login', async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Check if the user exists in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if the user is blocked
    if (user.blockedUntil && user.blockedUntil > Date.now()) {
      return res.status(403).json({ error: 'Account blocked. Please try again later.' });
    }

    // Check if the OTP is valid and not expired
    if (user.otp !== otp || user.otpExpiration < Date.now()) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 5) {
        user.blockedUntil = new Date(Date.now() + 60 * 60 * 1000); // Block the account for 1 hour
      }

      await user.save();

      return res.status(401).json({ error: 'Invalid OTP.' });
    }

    // Generate JWT token
    const token = jwt.sign({ email }, 'my_secret_key', { expiresIn: '1h' });
    res.json({ token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
