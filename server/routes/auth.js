const router = require('express').Router();
const User = require('../models/User');

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    // 1. Get data from the user
    const { name, email, password } = req.body;

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // 3. Create a new user
    const newUser = new User({
      name,
      email,
      password,
    });

    // 4. Save to Database
    const user = await newUser.save();
    res.status(200).json({ message: "User Registered Successfully!", user });

  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = router;