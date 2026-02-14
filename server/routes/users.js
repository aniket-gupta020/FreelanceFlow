const router = require('express').Router();
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');
const { sendEmail } = require('../utils/emailService');

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

router.post('/send-verification', verifyToken, async (req, res) => {
  try {
    let { email, type } = req.body;
    const userId = req.user.id;

    if (type === 'update_email' && !email) {
      return res.status(400).json({ message: "New email is required for verification." });
    }

    if (email) email = email.trim().toLowerCase();

    if (type === 'update_email') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "This email is already in use by another account." });
      }
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const targetEmail = (type === 'update_email') ? email : user.email;

    await sendEmail(targetEmail, otp, type || 'profile_update');

    res.status(200).json({ message: `Verification code sent to ${targetEmail}` });

  } catch (err) {
    console.error("❌ SEND VERIFICATION ERROR:", err);
    res.status(500).json({ message: 'Failed to send verification email', error: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "You can only update your own account" });
    }

    const currentUser = await User.findById(req.params.id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    const isEmailChanged = req.body.email && req.body.email.toLowerCase() !== currentUser.email.toLowerCase();
    const isPasswordChanged = !!req.body.password;

    if (isEmailChanged || isPasswordChanged) {
      const { otp } = req.body;

      if (!otp || currentUser.otp !== otp || currentUser.otpExpires < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired OTP. Please verify your identity." });
      }

      req.body.otp = undefined;
      req.body.otpExpires = undefined;

    }

    if (req.body.password) {
      const bcrypt = require('bcryptjs');
      const salt = bcrypt.genSaltSync(10);
      req.body.password = bcrypt.hashSync(req.body.password, salt);
    }

    const updateData = { ...req.body };

    if (isEmailChanged || isPasswordChanged) {
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateData,
        $unset: (isEmailChanged || isPasswordChanged) ? { otp: "", otpExpires: "" } : {}
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

    const user = await User.findById(req.params.id);
    if (!user) {
      console.log(`❌ DELETE FAILED: User ${req.params.id} not found`);
      return res.status(404).json({ message: "User not found" });
    }

    const { otp } = req.body;
    console.log(`👉 DELETE ATTEMPT: User=${user.email}, DB_OTP=${user.otp}, REQ_OTP=${otp}, Expires=${user.otpExpires}`);

    if (!otp || user.otp !== otp || user.otpExpires < Date.now()) {
      console.log("❌ DELETE FAILED: Invalid or Expired OTP");
      return res.status(400).json({ message: "Invalid or expired OTP. Account deletion requires verification." });
    }

    await User.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
    res.status(200).json({ message: 'User account deactivated (Ghost Mode)...' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;