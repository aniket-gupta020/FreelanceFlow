const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // ✅ Import cookie-parser
require('dotenv').config();

const authRoute = require('./routes/auth');
const projectRoute = require('./routes/projects');
const timelogRoute = require('./routes/timelogs');
const invoiceRoute = require('./routes/invoices');
const seedRoute = require('./routes/seed');
const usersRoute = require('./routes/users');
const tasksRoute = require('./routes/tasks');
const dashboardRoute = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ 1. TRUST PROXY (CRITICAL for Render + Cookies)
// Without this, 'secure: true' cookies will fail because Render is a proxy.
app.set('trust proxy', 1);

// ✅ 2. CORS SETTINGS
app.use(cors({
  origin: [
    "http://localhost:5173",                    // Local Development
    "https://freelance-flow-omega.vercel.app"   // Production Frontend
  ],
  credentials: true, // Allow cookies to cross borders
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(cookieParser()); // ✅ Initialize Cookie Parser

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => console.log('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoute);
app.use('/api/projects', projectRoute);
app.use('/api/timelogs', timelogRoute);
app.use('/api/invoices', invoiceRoute);
app.use('/api/seed', seedRoute);
app.use('/api/users', usersRoute);
app.use('/api/tasks', tasksRoute);
app.use('/api/dashboard', dashboardRoute);

app.get('/', (req, res) => {
  res.send('FreelanceFlow API is Running 🚀');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));