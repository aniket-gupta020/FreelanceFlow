const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/payment/fake-verify
// @desc    Simulate a payment and upgrade user to PRO
// @access  Private
router.post('/fake-verify', auth, async (req, res) => {
    try {
        // 1. Find the user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // 2. The "Fake" Transaction Logic
        // In a real app, we would check stripe/razorpay status here.
        // For now, we just trust the button click.

        user.plan = 'pro'; // <--- The Magic Switch
        await user.save();

        res.json({
            success: true,
            msg: "Payment Verified! Plan upgraded to PRO.",
            plan: user.plan
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;