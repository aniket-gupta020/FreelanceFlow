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

        // Find projects where I am the freelancer
        const workProjects = await Project.find({
            freelancer: userId,
            client: { $ne: userId }
        }).select('_id');

        const workProjectIds = workProjects.map(p => p._id);

        const tasks = await Task.find({
            project: { $in: workProjectIds },
            dueDate: { $gt: new Date() }
        })
            .sort({ dueDate: 1 })
            .populate('project', 'title');

        res.status(200).json(tasks);

    } catch (err) {
        console.error("Deadlines Error:", err);
        res.status(500).json({ message: "Server Error fetching deadlines" });
    }
});

module.exports = router;