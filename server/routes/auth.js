const router = require('express').Router();
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 👇 THIS IS THE KEY: Import your new Glassmorphism Service
const { sendEmail } = require('../utils/emailService');

// 1️⃣ REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    let { name, email, password, role, mobile, defaultHourlyRate, subscription } = req.body;
    if (email) email = email.trim().toLowerCase();

    console.log("👉 HIT REGISTER for:", email);

    // 0. STRICT VALIDATION 🛡️
    const nameRegex = /^[a-zA-Z\s]+$/;
    const mobileRegex = /^[0-9+\(\)\s-]+$/;

    if (!name || !nameRegex.test(name) || name.length < 2) {
      return res.status(400).json({ message: 'Invalid Name. Letters only, min 2 chars.' });
    }
    if (mobile && (!mobileRegex.test(mobile) || mobile.length < 10 || mobile.length > 15)) {
      return res.status(400).json({ message: 'Invalid Mobile Number.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 chars.' });
    }

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // 👻 RESTORATION LOGIC
      if (existingUser.isDeleted) {
        console.log("👻 RESTORING USER:", email);

        // Hash New Password
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        existingUser.isDeleted = false;
        existingUser.deletedAt = null;
        existingUser.password = hashed;
        existingUser.role = role || existingUser.role; // Optional: Update role if provided

        // Also ensure verification logic matches your flow
        // If they were verified before deletion, they stay verified.

        await existingUser.save();

        const userResponse = existingUser.toObject();
        delete userResponse.password;

        const secret = process.env.JWT_SECRET || 'devsecret';
        const token = jwt.sign({ id: existingUser._id, email: existingUser.email, name: existingUser.name, role: existingUser.role }, secret, { expiresIn: '7d' });

        return res.status(200).json({
          message: 'Account Restored Successfully! Welcome back.',
          user: userResponse,
          token
        });
      }

      if (existingUser.isVerified) {
        return res.status(400).json({ message: 'User already exists! Please login.' });
      } else {
        await User.deleteOne({ _id: existingUser._id });
      }
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hash Password & Save to TempUser
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const tempUserData = {
      email,
      otp,
      registrationData: {
        name,
        password: hashed,
        role: role || 'freelancer',
        mobile: mobile || '',
        defaultHourlyRate: defaultHourlyRate || 0,
        subscription: subscription || 'free'
      }
    };

    await TempUser.findOneAndUpdate(
      { email },
      tempUserData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 4. Send Email (USING THE NEW SERVICE) 🎨
    // This connects to emailService.js and grabs the glass design
    await sendEmail(email, otp, 'register');

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
      mobile: tempUser.registrationData.mobile,
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
      match = await bcrypt.compare(password, user.password);
    } catch (e) { match = false; }

    if (!match && user.password === password) {
      match = true;
      try {
        user.password = await bcrypt.hash(password, 10);
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

// 4️⃣ SEND OTP (For Login OR Forgot Password)
router.post('/send-otp', async (req, res) => {
  try {
    let { email, type } = req.body;
    if (email) email = email.trim().toLowerCase();

    console.log(`👉 HIT SEND-OTP (GLASS MODE) for: ${email} [Type: ${type || 'default'}]`);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send Email (Using Glass Template) 🎨
    // Default to 'passwordless' if no type provided, or use the type passed from frontend
    await sendEmail(email, otp, type || 'passwordless');

    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.log("❌ SEND OTP ERROR:", err);
    res.status(500).json({ message: 'Email Error', error: err.message });
  }
});

// 5️⃣ LOGIN VIA OTP / RESET PASSWORD VERIFY
router.post('/login-via-otp', async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (email) email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.otpExpires;

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name, role: user.role }, secret, { expiresIn: '7d' });

    res.status(200).json({ message: 'Login Successful!', user: userResponse, token });
  } catch (err) {
    console.log("❌ OTP LOGIN ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// 6️⃣ RESET PASSWORD (Uses OTP implicitly verified by flow or requires OTP in body)
router.post('/reset-password', async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;
    if (email) email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash New Password
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