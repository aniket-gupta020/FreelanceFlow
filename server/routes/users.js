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

    // 1. Fetch current user to check for sensitive changes
    const currentUser = await User.findById(req.params.id);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    // 2. Check for Sensitive Changes (Email or Password)
    const isEmailChanged = req.body.email && req.body.email.toLowerCase() !== currentUser.email.toLowerCase();
    const isPasswordChanged = !!req.body.password;

    if (isEmailChanged || isPasswordChanged) {
      const { otp } = req.body;

      // Verify OTP
      if (!otp || currentUser.otp !== otp || currentUser.otpExpires < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired OTP. Please verify your identity." });
      }

      // Clear OTP after successful verification
      req.body.otp = undefined;
      req.body.otpExpires = undefined;

      // We need to pass these undefined values to the update, but standard spread might ignore them depending on how we construct the update object below.
      // So we'll explicitly set them in the update query.
    }

    if (req.body.password) {
      const bcrypt = require('bcryptjs');
      const salt = bcrypt.genSaltSync(10);
      req.body.password = bcrypt.hashSync(req.body.password, salt);
    }

    // Construct Update Object
    const updateData = { ...req.body };

    // Explicitly unset OTP fields if they were used
    if (isEmailChanged || isPasswordChanged) {
      // In Mongoose for findByIdAndUpdate, we often use $set and $unset.
      // But here we are using a simple object. Let's restart the strategy for the update call below.
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

    // 1. Fetch user
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Verify OTP
    const { otp } = req.body;
    if (!otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP. Account deletion requires verification." });
    }

    // 3. Delete
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User has been deleted..." });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;