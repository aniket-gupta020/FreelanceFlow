const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoute = require('./routes/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => console.log(err));

// Routes
app.use('/api/auth', authRoute);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));