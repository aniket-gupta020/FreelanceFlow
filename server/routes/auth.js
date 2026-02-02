const router = require('express').Router();
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// 🔴 FINAL CONFIGURATION: Port 587 + IPv4 (The Firewall Buster)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  family: 4 // Forces IPv4
});

// 1️⃣ REGISTER ROUTE (Uses TempUser)
router.post('/register', async (req, res) => {
  try {
    let { name, email, password, role, defaultHourlyRate, subscription } = req.body;
    if (email) email = email.trim().toLowerCase();

    console.log("👉 HIT REGISTER for:", email);

    // 1. Check if user already exists in MAIN database
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: 'User already exists! Please login.' });
      } else {
        // Cleanup old unverified user
        console.log("♻️ Deleting old unverified user.");
        await User.deleteOne({ _id: existingUser._id });
      }
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hash Password
    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(password, salt);

    // 4. Save to TempUser
    const tempUserData = {
      email,
      otp,
      registrationData: {
        name,
        password: hashed,
        role: role || 'freelancer',
        defaultHourlyRate: defaultHourlyRate || 0,
        subscription: subscription || 'free'
      }
    };

    await TempUser.findOneAndUpdate(
      { email },
      tempUserData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 5. Send Email
    const mailOptions = {
      from: `"FreelanceFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'FreelanceFlow - Email Verification OTP',
      text: `Your OTP for verification is: ${otp}. It expires in 10 minutes.`
    };

    console.log("📨 Attempting to send email via Port 587...");
    await transporter.sendMail(mailOptions);
    console.log("✅ OTP Sent successfully!");

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: email
    });

  } catch (err) {
    console.log("❌ REGISTER ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// 2️⃣ VERIFY OTP ROUTE
router.post('/verify-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (email) email = email.trim().toLowerCase();

    const tempUser = await TempUser.findOne({ email });

    if (!tempUser) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'User already registered. Please login.' });
      return res.status(400).json({ message: 'OTP expired or invalid. Please register again.' });
    }

    if (tempUser.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const newUser = new User({
      name: tempUser.registrationData.name,
      email: tempUser.email,
      password: tempUser.registrationData.password,
      role: tempUser.registrationData.role,
      defaultHourlyRate: tempUser.registrationData.defaultHourlyRate,
      subscription: tempUser.registrationData.subscription,
      isVerified: true
    });

    const savedUser = await newUser.save();
    await TempUser.deleteOne({ email });

    const userResponse = savedUser.toObject();
    delete userResponse.password;

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ id: savedUser._id, email: savedUser.email, name: savedUser.name, role: savedUser.role }, secret, { expiresIn: '7d' });

    res.status(200).json({ message: 'Email Verified Successfully!', user: userResponse, token });

  } catch (err) {
    console.log("❌ VERIFY OTP ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// 3️⃣ LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (email) email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified === false) {
      return res.status(403).json({ message: 'Please verify your email first.' });
    }

    let match = false;
    try {
      match = bcrypt.compareSync(password, user.password);
    } catch (e) { match = false; }

    if (!match && user.password === password) {
      match = true;
      try {
        user.password = bcrypt.hashSync(password, 10);
        await user.save();
      } catch (e) { }
    }

    if (!match) return res.status(400).json({ message: 'Wrong Password!' });

    const userResponse = user.toObject();
    delete userResponse.password;

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name, role: user.role }, secret, { expiresIn: '7d' });

    res.status(200).json({ message: 'Login Successful!', user: userResponse, token });
  } catch (err) {
    console.log("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;