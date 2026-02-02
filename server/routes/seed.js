const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');

router.post('/', async (req, res) => {
  try {
    const seedClientEmail = 'client@freelanceflow.test';
    const seedFreelancerEmail = 'freelancer@freelanceflow.test';
    const seedProjectTitle = 'Seed Project - E-Commerce App';

    const oldUsers = await User.find({ email: { $in: [seedClientEmail, seedFreelancerEmail] } });
    const oldUserIds = oldUsers.map(u => u._id);

    await User.deleteMany({ email: { $in: [seedClientEmail, seedFreelancerEmail] } });

    const oldProjects = await Project.find({ title: seedProjectTitle });
    const oldProjectIds = oldProjects.map(p => p._id);
    await Project.deleteMany({ title: seedProjectTitle });

    await Task.deleteMany({
      $or: [{ project: { $in: oldProjectIds } }, { assignedTo: { $in: oldUserIds } }]
    });
    await TimeLog.deleteMany({
      $or: [{ project: { $in: oldProjectIds } }, { user: { $in: oldUserIds } }]
    });

    const hashed = bcrypt.hashSync('seed-pass', 10);
    const client = await User.create({
      name: 'Acme Corp',
      email: seedClientEmail,
      password: hashed,
      role: 'client',
      subscription: 'pro',
      defaultHourlyRate: 1200
    });

    const hashedF = bcrypt.hashSync('seed-pass', 10);
    const freelancer = await User.create({
      name: 'Jane Doe',
      email: seedFreelancerEmail,
      password: hashedF,
      role: 'freelancer',
      defaultHourlyRate: 800
    });

    const project = await Project.create({
      title: seedProjectTitle,
      description: 'An auto-generated project to test the system.',
      budget: 50000,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      client: client._id
    });

    await Task.create({
      title: 'Setup Database',
      description: 'Initialize MongoDB and create collections',
      project: project._id,
      assignedTo: freelancer._id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });

    await TimeLog.create({
      project: project._id,
      user: freelancer._id,
      description: 'Initial project setup',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endTime: new Date(),
      durationHours: 2,
      billed: false
    });

    res.status(200).json({ message: 'Sample data reset successfully!', client, project });
  } catch (err) {
    console.error("Seed Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;