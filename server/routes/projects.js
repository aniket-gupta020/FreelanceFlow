const router = require('express').Router();
const Project = require('../models/Project');
const verifyToken = require('../middleware/verifyToken');

router.get('/', async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('client', 'name email')
      .populate('applicants', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email')
      .populate('applicants', 'name email');

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json(project);
  } catch (err) {
    res.status(500).json(err);
  }
});

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

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isOwner = String(project.client._id || project.client) === String(req.user.id);

    if (!isOwner) {
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const updateData = { ...req.body };
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