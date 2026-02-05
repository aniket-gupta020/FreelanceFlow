const router = require('express').Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const verifyToken = require('../middleware/verifyToken');

// GET /api/dashboard/deadlines
router.get('/deadlines', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Find "Work" Projects Only
        // Projects where I am the freelancer but NOT the client (owner)
        const workProjects = await Project.find({
            freelancer: userId,
            client: { $ne: userId } // Explicitly exclude projects I own
        }).select('_id');

        const workProjectIds = workProjects.map(p => p._id);

        // 2. Fetch Tasks for these projects
        const tasks = await Task.find({
            project: { $in: workProjectIds },
            dueDate: { $gt: new Date() } // Future deadlines only
        })
            .sort({ dueDate: 1 }) // Soonest first
            .populate('project', 'title'); // Populate project title for UI

        res.status(200).json(tasks);

    } catch (err) {
        console.error("Error fetching deadlines:", err);
        res.status(500).json({ message: "Server Error fetching deadlines" });
    }
});

module.exports = router;
