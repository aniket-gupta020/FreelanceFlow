const router = require('express').Router();
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService');

const sendTokenResponse = (user, statusCode, res, message) => {
  const secret = process.env.JWT_SECRET || 'devsecret';
  const token = jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    secret,
    { expiresIn: '7d' }
  );

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.otp;
  delete userResponse.otpExpires;
  delete userResponse.isDeleted;
  delete userResponse.deletedAt;

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
    .status(statusCode)
    .json({
      message,
      user: userResponse,
      token
    });
};

router.post('/register', async (req, res) => {
  try {
    let { name, email, password, role, mobile, subscription } = req.body;
    if (email) email = email.trim().toLowerCase();

    console.log("👉 HIT REGISTER for:", email);

    const nameRegex = /^[a-zA-Z\s]+$/;
    const mobileRegex = /^[0-9+\(\)\s-]+$/;

    if (!name || !nameRegex.test(name) || name.length < 2) return res.status(400).json({ message: 'Invalid Name.' });
    if (mobile && (!mobileRegex.test(mobile) || mobile.length < 10)) return res.status(400).json({ message: 'Invalid Mobile.' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password too short.' });

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isDeleted) {
        console.log("👻 RESTORING USER:", email);

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        existingUser.isDeleted = false;
        existingUser.deletedAt = null;
        existingUser.password = hashed;
        existingUser.role = role || existingUser.role;

        await existingUser.save();

        return sendTokenResponse(existingUser, 200, res, 'Account Restored Successfully! Welcome back.');
      }

      if (existingUser.isVerified) {
        return res.status(400).json({ message: 'User already exists! Please login.' });
      } else {
        await User.deleteOne({ _id: existingUser._id });
      }
    }

    if (mobile) {
      const existingMobile = await User.findOne({ mobile, isDeleted: false });
      if (existingMobile) {
        return res.status(400).json({ message: 'Mobile number already registered! Please login.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashed,
      role: role || 'freelancer',
      mobile: mobile || '',
      subscription: subscription || 'free',
      isVerified: true
    });

    const savedUser = await newUser.save();

    sendTokenResponse(savedUser, 201, res, 'Registration Successful! Welcome to FreelanceFlow.');

  } catch (err) {
    console.log("❌ REGISTER ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (email) email = email.trim().toLowerCase();

    const tempUser = await TempUser.findOne({ email });

    if (!tempUser) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'User already registered. Please login.' });
      return res.status(400).json({ message: 'OTP expired or invalid.' });
    }

    if (tempUser.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const newUser = new User({
      name: tempUser.registrationData.name,
      email: tempUser.email,
      password: tempUser.registrationData.password,
      role: tempUser.registrationData.role,
      mobile: tempUser.registrationData.mobile,
      defaultHourlyRate: tempUser.registrationData.defaultHourlyRate,
      subscription: tempUser.registrationData.subscription,
      isVerified: true
    });

    const savedUser = await newUser.save();
    await TempUser.deleteOne({ email });

    sendTokenResponse(savedUser, 200, res, 'Email Verified Successfully!');

  } catch (err) {
    console.log("❌ VERIFY OTP ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (email) email = email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isDeleted) {
      return res.status(403).json({ message: 'Account is deactivated. Please Register again to restore it.' });
    }

    if (user.isVerified === false) {
      return res.status(403).json({ message: 'Please verify your email first.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Wrong Password!' });

    sendTokenResponse(user, 200, res, 'Login Successful!');

  } catch (err) {
    console.log("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    let { email, type } = req.body;
    if (email) email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await sendEmail(email, otp, type || 'passwordless');

    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.log("❌ SEND OTP ERROR:", err);
    res.status(500).json({ message: 'Email Error', error: err.message });
  }
});

router.post('/login-via-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (email) email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user || user.isDeleted) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Login Successful!');

  } catch (err) {
    console.log("❌ OTP LOGIN ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;
    if (email) email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    user.password = hashed;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password Reset Successful! You can now login.' });
  } catch (err) {
    console.log("❌ RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;