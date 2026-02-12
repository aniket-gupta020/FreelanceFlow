const router = require('express').Router();
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// ✅ SELF-CONTAINED MIDDLEWARE (Prevents "Missing Middleware" crashes)
const verifyToken = (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "You are not authenticated!" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token is not valid!" });
        req.user = user;
        next();
    });
};

// 1️⃣ GET DASHBOARD STATS (Income/Expenses)
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // Active Projects
        const activeProjects = await Project.countDocuments({
            $or: [{ client: userId }, { freelancer: userId }],
            status: 'active'
        });

        // Total Income (Freelancer)
        const incomeAgg = await Invoice.aggregate([
            { $match: { freelancer: userId, status: 'paid' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // Total Expenses (Client)
        const expenseAgg = await Invoice.aggregate([
            { $match: { client: userId, status: 'paid' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.status(200).json({
            activeProjects,
            totalIncome: incomeAgg[0]?.total || 0,
            totalExpenses: expenseAgg[0]?.total || 0
        });

    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json(err);
    }
});

// 2️⃣ GET DEADLINES (Your Logic)
router.get('/deadlines', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Find projects where I am the freelancer OR the creator (client)
        // AND the project is NOT completed
        const projects = await Project.find({
            $or: [
                { freelancer: userId },
                { createdBy: userId }
            ],
            status: { $ne: 'completed' },
            deadline: { $gt: new Date() } // Only future project deadlines
        }).select('title deadline');

        const projectIds = projects.map(p => p._id);

        // Fetch upcoming tasks for these projects
        const tasks = await Task.find({
            project: { $in: projectIds },
            dueDate: { $gt: new Date() },
            status: { $ne: 'done' }
        })
            .sort({ dueDate: 1 })
            .populate('project', 'title');

        // Map projects to look like tasks for the UI
        const projectDeadlines = projects.map(p => ({
            _id: p._id,
            title: "Project Deadline",
            project: { title: p.title },
            dueDate: p.deadline,
            isProjectDeadline: true // Optional flag for UI distinctions
        }));

        // Combine and Sort by Date
        const allDeadlines = [...tasks, ...projectDeadlines].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // Return top 10 soonest deadlines
        res.status(200).json(allDeadlines.slice(0, 10));

    } catch (err) {
        console.error("Deadlines Error:", err);
        res.status(500).json({ message: "Server Error fetching deadlines" });
    }
});

module.exports = router;