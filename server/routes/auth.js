const router = require('express').Router();
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Configure Email Sender
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1️⃣ REGISTER ROUTE (Uses TempUser)
router.post('/register', async (req, res) => {
  try {
    let { name, email, password, role, defaultHourlyRate, subscription } = req.body;
    if (email) email = email.trim().toLowerCase();

    console.log("👉 HIT REGISTER ROUTE for:", email);

    console.log("👉 HIT REGISTER ROUTE for:", email);
    console.log("DEBUG: User Model Collection ->", User.collection.name);
    console.log("DEBUG: TempUser Model Collection ->", TempUser.collection.name);

    // Check if user already exists in MAIN database
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log(`⚠️ User found in DB. ID: ${existingUser._id}, Verified: ${existingUser.isVerified}`);

      if (existingUser.isVerified === true) {
        console.log("❌ User is VERIFIED. Blocking registration.");
        return res.status(400).json({
          message: `User already exists! (ID: ${existingUser._id}, Verified: ${existingUser.isVerified})`
        });
      } else {
        console.log("♻️ User exists but exists UNVERIFIED (or undefined). Deleting to allow fresh OTP sequence.");
        await User.deleteOne({ _id: existingUser._id });
        console.log("✅ Stale user deleted.");
      }
    } else {
      console.log("✅ No existing user found in main DB.");
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash Password
    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(password, salt);

    // Prepare new temp user data
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

    // Upsert into TempUser (Create or Update if email exists in TempUser)
    await TempUser.findOneAndUpdate(
      { email },
      tempUserData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send Email
    const mailOptions = {
      from: `"FreelanceFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'FreelanceFlow - Email Verification OTP',
      text: `Your OTP for verification is: ${otp}. It expires in 10 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("❌ EMAIL ERROR:", error);
      } else {
        console.log('✅ Email sent: ' + info.response);
      }
    });

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: email
    });

  } catch (err) {
    console.log("❌ REGISTER ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// 2️⃣ VERIFY OTP ROUTE (Moves TempUser -> User)
router.post('/verify-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (email) email = email.trim().toLowerCase();

    // Find in TempUser
    const tempUser = await TempUser.findOne({ email });

    if (!tempUser) {
      // Check if they are already in main User db (maybe verified in another tab?)
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'User already registered. Please login.' });
      return res.status(400).json({ message: 'OTP expired or invalid email. Please register again.' });
    }

    // Validate OTP
    if (tempUser.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Move to Real User Collection
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

    // Delete from TempUser
    await TempUser.deleteOne({ email });

    // Generate Token
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ id: savedUser._id, email: savedUser.email, name: savedUser.name, role: savedUser.role }, secret, { expiresIn: '7d' });

    res.status(200).json({ message: 'Email Verified Successfully!', user: userResponse, token });
  } catch (err) {
    console.log("❌ VERIFY OTP ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// 3️⃣ LOGIN ROUTE (Protected)
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (email) email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check verification status
    if (user.isVerified === false) {
      return res.status(403).json({ message: 'Please verify your email first.' });
    }

    let match = false;
    try {
      match = bcrypt.compareSync(password, user.password);
    } catch (e) {
      match = false;
    }

    if (!match && user.password === password) {
      match = true;
      try {
        const newHash = bcrypt.hashSync(password, 10);
        user.password = newHash;
        await user.save();
      } catch (e) { }
    }

    if (!match) return res.status(400).json({ message: 'Wrong Password!' });

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name, role: user.role }, secret, { expiresIn: '7d' });

    res.status(200).json({ message: 'Login Successful!', user: userResponse, token });
  } catch (err) {
    console.log("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;