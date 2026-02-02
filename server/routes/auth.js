const router = require('express').Router();
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// 🔴 DEBUG CONFIGURATION (Fail Fast + Log Everything)
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  family: 4, // Forces IPv4
  logger: true, // 🔍 PRINTS DEBUG LOGS TO CONSOLE
  debug: true,  // 🔍 ENABLES DEBUGGING
  connectionTimeout: 5000, // 5 Seconds (Stop hanging!)
  greetingTimeout: 5000,   // 5 Seconds
  socketTimeout: 5000      // 5 Seconds
});

// 1️⃣ REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    let { name, email, password, role, defaultHourlyRate, subscription } = req.body;
    if (email) email = email.trim().toLowerCase();

    console.log("👉 HIT REGISTER for:", email);
    console.log("Checking Environment Variables...");
    console.log("EMAIL_USER Length:", process.env.EMAIL_USER ? process.env.EMAIL_USER.length : "MISSING");
    console.log("EMAIL_PASS Length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : "MISSING");

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: 'User already exists! Please login.' });
      } else {
        await User.deleteOne({ _id: existingUser._id });
      }
    }

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hash Password & Save to TempUser
    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(password, salt);

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

    // 4. Send Email
    const mailOptions = {
      from: `"FreelanceFlow" <mail.akguptaji@gmail.com>`, // Must match your Brevo account email
      to: email,
      subject: 'FreelanceFlow - Email Verification OTP',
      text: `Your OTP for verification is: ${otp}. It expires in 10 minutes.`
    };

    console.log("📨 Connecting to Brevo...");
    await transporter.sendMail(mailOptions);
    console.log("✅ OTP Sent successfully!");

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: email
    });

  } catch (err) {
    console.log("❌ REGISTER ERROR:", err);
    // Return the specific error message to the frontend so we can see it
    res.status(500).json({ message: 'Email Error', error: err.message, code: err.code });
  }
});

// ... (Keep the rest of the file same) ...
module.exports = router;