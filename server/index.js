const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // ✅ Import cookie-parser
require('dotenv').config();

const authRoute = require('./routes/auth');
const projectRoute = require('./routes/projects');
const timelogRoute = require('./routes/timelogs');
const invoiceRoute = require('./routes/invoices');
const usersRoute = require('./routes/users');
const tasksRoute = require('./routes/tasks');
const dashboardRoute = require('./routes/dashboard');
const paymentRoute = require('./routes/payment');
const clientRoute = require('./routes/clients');

const app = express();

// 🏓 Keep-Alive Route (The Robot's Door)
app.get('/ping', (req, res) => {
  res.status(200).send('Pong');
});

const PORT = process.env.PORT || 5000;

// ✅ 1. TRUST PROXY (CRITICAL for Render + Cookies)
// Without this, 'secure: true' cookies will fail because Render is a proxy.
app.set('trust proxy', 1);

// ✅ 2. CORS SETTINGS
app.use(cors({
  origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"] : [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://freelance-flow-omega.vercel.app"
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
app.use('/api/users', usersRoute);
app.use('/api/tasks', tasksRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/payment', paymentRoute);
app.use('/api/clients', clientRoute);

app.get('/', (req, res) => {
  res.send('FreelanceFlow API is Running 🚀');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));