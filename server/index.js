const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 2. Test Route
app.get('/', (req, res) => {
  res.send('FreelanceFlow API is Running');
});

// 3. Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});