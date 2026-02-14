const router = require('express').Router();
const mongoose = require('mongoose');
const TimeLog = require('../models/TimeLog');
const Project = require('../models/Project');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const ownedProjects = await Project.find({
      $or: [
        { client: req.user.id },
        { createdBy: req.user.id }
      ]
    }).select('_id');

    const ownedProjectIds = ownedProjects.map(p => p._id);

    const logs = await TimeLog.find({
      $or: [
        { user: req.user.id },
        { project: { $in: ownedProjectIds } }
      ]
    })
      .populate('project', 'title')
      .populate('user', 'name email defaultHourlyRate mobile')
      .sort({ startTime: -1 });

    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/unbilled', async (req, res) => {
  try {
    const logs = await TimeLog.find({ user: req.user.id, billed: false });
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log("📥 New TimeLog Request:", req.body);

    const { projectId, startTime, endTime, description } = req.body;

    if (!projectId) return res.status(400).json({ message: "Missing Project ID" });
    if (!startTime || !endTime) return res.status(400).json({ message: "Missing Time" });

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end - start) / (1000 * 60 * 60);

    const newLog = new TimeLog({
      user: new mongoose.Types.ObjectId(req.user.id),
      project: new mongoose.Types.ObjectId(projectId),
      description: description || 'Manual Entry',
      startTime: start,
      endTime: end,
      durationHours: Number(durationHours.toFixed(2)),
      billed: false
    });

    const savedLog = await newLog.save();
    console.log("✅ Saved Log:", savedLog._id);

    const populatedLog = await savedLog.populate([
      { path: 'project', select: 'title' },
      { path: 'user', select: 'name email defaultHourlyRate mobile' }
    ]);

    res.status(200).json(populatedLog);

  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await TimeLog.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;