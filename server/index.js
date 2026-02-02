const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoute = require('./routes/auth');
const projectRoute = require('./routes/projects');
const timelogRoute = require('./routes/timelogs');
const invoiceRoute = require('./routes/invoices');
const seedRoute = require('./routes/seed');
const clientsRoute = require('./routes/clients');
const usersRoute = require('./routes/users');
const tasksRoute = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => console.log('❌ MongoDB Connection Error:', err));

app.use('/api/auth', authRoute);
app.use('/api/projects', projectRoute);
app.use('/api/timelogs', timelogRoute);
app.use('/api/invoices', invoiceRoute);
app.use('/api/seed', seedRoute);
app.use('/api/clients', clientsRoute);
app.use('/api/users', usersRoute);
app.use('/api/tasks', tasksRoute);

app.get('/', (req, res) => {
  res.send('FreelanceFlow API is Running 🚀');
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));