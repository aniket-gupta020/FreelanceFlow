const router = require('express').Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

router.get('/', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ message: "Project ID is required" });

        const tasks = await Task.find({ project: projectId })
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, description, projectId, project, assignedTo, dueDate, deadline, status } = req.body;

        const effectiveProjectId = projectId || project;
        if (!effectiveProjectId) return res.status(400).json({ message: "Project ID is required" });

        const projectExists = await Project.findById(effectiveProjectId);
        if (!projectExists) return res.status(404).json({ message: "Project not found" });

        const newTask = new Task({
            title,
            description,
            project: effectiveProjectId,
            assignedTo: assignedTo || null,
            dueDate: dueDate || deadline,
            status: status ? status.toLowerCase().replace(' ', '-') : 'todo'
        });

        const savedTask = await newTask.save();
        res.status(200).json(savedTask);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('assignedTo', 'name email');

        res.status(200).json(updatedTask);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Task deleted" });
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;