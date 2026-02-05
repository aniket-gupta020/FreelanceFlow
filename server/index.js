const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoute = require('./routes/auth');
const projectRoute = require('./routes/projects');
const timelogRoute = require('./routes/timelogs');
const invoiceRoute = require('./routes/invoices');
const seedRoute = require('./routes/seed');
const usersRoute = require('./routes/users');
const tasksRoute = require('./routes/tasks');
const dashboardRoute = require('./routes/dashboard'); // New Dashboard Route

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ UPDATED CORS SETTINGS (The Handshake)
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://freelance-flow-omega.vercel.app",
    "https://freelance-flow-omega.vercel.app/"
  ],
  credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => console.log('❌ MongoDB Connection Error:', err));

app.use('/api/auth', authRoute);
app.use('/api/projects', projectRoute);
app.use('/api/timelogs', timelogRoute);
app.use('/api/invoices', invoiceRoute);
app.use('/api/seed', seedRoute);
app.use('/api/users', usersRoute);
app.use('/api/tasks', tasksRoute);
app.use('/api/dashboard', dashboardRoute); // Mount dashboard route

app.get('/', (req, res) => {
  res.send('FreelanceFlow API is Running 🚀');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT} - WITH TEMP USER LOGIC`));