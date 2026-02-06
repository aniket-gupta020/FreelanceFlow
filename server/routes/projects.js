const router = require('express').Router();
const Project = require('../models/Project');
const verifyToken = require('../middleware/verifyToken');

// 1️⃣ GET ALL PROJECTS
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('client', 'name email mobile isDeleted')
      // 👇 FIXED: Added 'defaultHourlyRate' so the report can calculate cost
      .populate('applicants', 'name email defaultHourlyRate mobile isDeleted')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2️⃣ GET SINGLE PROJECT
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email mobile isDeleted')
      // 👇 FIXED: Added 'defaultHourlyRate' here too
      .populate('applicants', 'name email defaultHourlyRate mobile isDeleted');

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json(project);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3️⃣ CREATE PROJECT
router.post('/', verifyToken, async (req, res) => {
  try {
    const clientId = req.body.client || req.user.id;

    const payload = {
      ...req.body,
      client: clientId,
      createdBy: req.user.id
    };

    const newProject = new Project(payload);
    const savedProject = await newProject.save();
    res.status(200).json(savedProject);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4️⃣ DELETE PROJECT
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = String(project.client._id || project.client) === String(req.user.id);

    // Note: You had an empty if block here in your original code.
    // Ideally, you should uncomment the next line to enforce security:
    // if (!isOwner) return res.status(403).json({ message: "You are not authorized to delete this project" });

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json(err);
  }
});

// 5️⃣ UPDATE PROJECT
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const updateData = { ...req.body };
    // Auto-set completedAt timestamp if status changes to completed
    if (req.body.status === 'completed' && project.status !== 'completed') {
      updateData.completedAt = new Date();
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.status(200).json(updatedProject);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 6️⃣ APPLY TO PROJECT
router.post('/:id/apply', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const project = await Project.findById(req.params.id);

    const alreadyApplied = project.applicants.some(id => String(id) === String(userId));

    if (alreadyApplied) {
      return res.status(400).json({ message: "You already applied!" });
    }

    project.applicants.push(userId);
    await project.save();

    res.status(200).json({ message: "Application Successful!" });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;