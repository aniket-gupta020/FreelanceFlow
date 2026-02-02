const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
  try {
    let { name, email, password, role, defaultHourlyRate, subscription } = req.body;
    if (email) email = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists!' });

    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashed,
      role: role || 'freelancer',
      defaultHourlyRate: defaultHourlyRate || 0,
      subscription: subscription || 'free'
    });

    const saved = await newUser.save();

    const userResponse = saved.toObject();
    delete userResponse.password;

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ id: saved._id, email: saved.email, name: saved.name, role: saved.role }, secret, { expiresIn: '7d' });

    res.status(200).json({ message: 'User Registered Successfully!', user: userResponse, token });
  } catch (err) {
    console.log("❌ REGISTER ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (email) email = email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

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

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name, role: user.role }, secret, { expiresIn: '7d' });

    res.status(200).json({ message: 'Login Successful!', user: userResponse, token });
  } catch (err) {
    console.log("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;