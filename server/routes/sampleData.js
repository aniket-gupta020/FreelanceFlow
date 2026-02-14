const router = require('express').Router();
const Client = require('../models/Client');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const Invoice = require('../models/Invoice');
const verifyToken = require('../middleware/verifyToken');

const SAMPLE_CLIENT_EMAIL = 'mail.akgutaji@gmail.com';

router.get('/status', verifyToken, async (req, res) => {
    try {
        const client = await Client.findOne({ email: SAMPLE_CLIENT_EMAIL, user: req.user.id });
        res.status(200).json({ isLoaded: !!client });
    } catch (err) {
        console.error("Status check failed:", err);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

router.post('/load', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("Loading sample data for user:", userId);

        const existingClient = await Client.findOne({ email: SAMPLE_CLIENT_EMAIL, user: userId });
        if (existingClient) {
            console.log("Sample data already exists for this user");
            return res.status(400).json({ message: "Sample data already loaded" });
        }

        console.log("Step 1: Creating Client...");
        const client = new Client({
            name: 'AK Corp.',
            email: SAMPLE_CLIENT_EMAIL,
            phone: '+917414908640',
            defaultHourlyRate: 1500,
            user: userId
        });
        const savedClient = await client.save();
        console.log("Client saved:", savedClient._id);

        console.log("Step 2: Creating Project...");
        const project = new Project({
            title: 'FreelanceFlow',
            description: 'Freelancers are small business owners who often struggle with the administrative side of their work. They use Trello for tasks, Excel for finances, and Word for invoices. "FreelanceFlow" consolidates this chaos into a single dashboard.',
            startDate: new Date('2026-02-01'),
            deadline: new Date('2026-03-01'),
            budget: 45000,
            hourlyRate: 1500,
            client: savedClient._id,
            createdBy: userId,
            status: 'in-progress'
        });
        const savedProject = await project.save();
        console.log("Project saved:", savedProject._id);

        console.log("Step 3: Creating Tasks...");
        const tasks = [
            { title: 'Setup Database Schema', status: 'done', project: savedProject._id },
            { title: 'Implement Authentication', status: 'in-progress', project: savedProject._id },
            { title: 'Design Dashboard UI', status: 'todo', project: savedProject._id }
        ];
        await Task.insertMany(tasks);
        console.log("Tasks saved");

        console.log("Step 4: Creating Time Logs...");
        const timeLogs = [
            {
                project: savedProject._id,
                user: userId,
                description: 'Research and planning',
                startTime: new Date('2026-02-01T09:00:00'),
                endTime: new Date('2026-02-01T12:00:00'),
                durationHours: 3,
                status: 'paid',
                billed: true
            },
            {
                project: savedProject._id,
                user: userId,
                description: 'Initial backend setup',
                startTime: new Date('2026-02-02T10:00:00'),
                endTime: new Date('2026-02-02T14:00:00'),
                durationHours: 4,
                status: 'billed',
                billed: true
            },
            {
                project: savedProject._id,
                user: userId,
                description: 'Frontend component building',
                startTime: new Date('2026-02-03T11:00:00'),
                endTime: new Date('2026-02-03T13:30:00'),
                durationHours: 2.5,
                status: 'unbilled',
                billed: false
            }
        ];
        const savedLogs = await TimeLog.insertMany(timeLogs);
        console.log("Time logs saved");

        console.log("Step 5: Creating Invoices...");
        const invoice1 = new Invoice({
            invoiceNumber: `INV-SAMPLE-${Date.now()}-1`,
            project: savedProject._id,
            client: savedClient._id,
            freelancer: userId,
            items: [{ description: 'Research and planning', hours: 3, hourlyRate: 1500, amount: 4500 }],
            logs: [savedLogs[0]._id],
            totalHours: 3,
            subtotal: 4500,
            totalAmount: 4500,
            status: 'paid',
            dueDate: new Date('2026-02-15'),
            paidDate: new Date('2026-02-10')
        });
        await invoice1.save();
        console.log("Invoice 1 saved");

        const invoice2 = new Invoice({
            invoiceNumber: `INV-SAMPLE-${Date.now()}-2`,
            project: savedProject._id,
            client: savedClient._id,
            freelancer: userId,
            items: [{ description: 'Initial backend setup', hours: 4, hourlyRate: 1500, amount: 6000 }],
            logs: [savedLogs[1]._id],
            totalHours: 4,
            subtotal: 6000,
            totalAmount: 6000,
            status: 'sent',
            dueDate: new Date('2026-02-28')
        });
        await invoice2.save();
        console.log("Invoice 2 saved");

        console.log("Updating logs with invoice IDs...");
        await TimeLog.findByIdAndUpdate(savedLogs[0]._id, { invoice: invoice1._id });
        await TimeLog.findByIdAndUpdate(savedLogs[1]._id, { invoice: invoice2._id });
        console.log("Logs updated");

        res.status(201).json({ message: "Sample data loaded successfully" });
    } catch (err) {
        console.error("Error loading sample data:", err);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

router.delete('/unload', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const client = await Client.findOne({ email: SAMPLE_CLIENT_EMAIL, user: userId });

        if (!client) {
            return res.status(404).json({ message: "Sample data not found" });
        }

        const projects = await Project.find({ client: client._id });
        const projectIds = projects.map(p => p._id);

        await Invoice.deleteMany({ client: client._id });
        await TimeLog.deleteMany({ project: { $in: projectIds } });
        await Task.deleteMany({ project: { $in: projectIds } });
        await Project.deleteMany({ client: client._id });
        await Client.findByIdAndDelete(client._id);

        res.status(200).json({ message: "Sample data unloaded successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;