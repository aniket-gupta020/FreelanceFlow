const router = require('express').Router();
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

router.get('/', async (req, res) => {
  try {
    const query = req.query.new ? { sort: { createdAt: -1 } } : {};

    const users = await User.find().select('-password').sort(query.sort);
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "You can only update your own account" });
    }

    if (req.body.password) {
      const bcrypt = require('bcryptjs');
      const salt = bcrypt.genSaltSync(10);
      req.body.password = bcrypt.hashSync(req.body.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "You can only delete your own account" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User has been deleted..." });
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- OTP Profile Updates Implementation ---

const nodemailer = require('nodemailer');
// Reusing Brevo configuration from auth.js (Port 2525)
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 2525,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  family: 4,
  connectionTimeout: 5000
});

// 1. Request OTP for Password Change (Sends to CURRENT email)
router.post('/:id/request-password-change-otp', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) return res.status(403).json({ message: "Unauthorized" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const mailOptions = {
      from: `"FreelanceFlow" <mail.akguptaji@gmail.com>`,
      to: user.email,
      subject: 'FreelanceFlow - Password Change OTP',
      text: `Your OTP for changing your password is: ${otp}. It expires in 10 minutes.`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent to your email" });

  } catch (err) {
    console.error("OTP Request Error:", err);
    res.status(500).json(err);
  }
});

// 2. Verify OTP & Update Password
router.post('/:id/update-password-otp', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) return res.status(403).json({ message: "Unauthorized" });

    const { otp, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    user.password = bcrypt.hashSync(newPassword, salt);

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. Request OTP for Email Change (Sends to NEW email)
router.post('/:id/request-email-change-otp', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) return res.status(403).json({ message: "Unauthorized" });

    let { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ message: "New email is required" });

    newEmail = newEmail.trim().toLowerCase();

    // Check if new email is already taken
    const existing = await User.findOne({ email: newEmail });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const user = await User.findById(req.params.id);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.tempEmailChange = {
      newEmail,
      otp,
      otpExpires
    };
    await user.save();

    const mailOptions = {
      from: `"FreelanceFlow" <mail.akguptaji@gmail.com>`,
      to: newEmail,
      subject: 'FreelanceFlow - Email Change Verification',
      text: `Your OTP for verifying your new email (${newEmail}) is: ${otp}.`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: `OTP sent to ${newEmail}` });

  } catch (err) {
    console.error("Email Change OTP Error:", err);
    res.status(500).json(err);
  }
});

// 4. Verify OTP & Update Email
router.post('/:id/update-email-otp', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) return res.status(403).json({ message: "Unauthorized" });

    const { otp } = req.body;
    const user = await User.findById(req.params.id);

    if (!user.tempEmailChange || !user.tempEmailChange.otp ||
      user.tempEmailChange.otp !== otp ||
      user.tempEmailChange.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Update Email
    user.email = user.tempEmailChange.newEmail;

    // Clear Temp Data
    user.tempEmailChange = undefined;
    await user.save();

    res.status(200).json({ message: "Email updated successfully", newEmail: user.email });

  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;