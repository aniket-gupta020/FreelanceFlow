const mongoose = require('mongoose');
require('dotenv').config();

const Client = require('./models/Client');
const Project = require('./models/Project');
const Task = require('./models/Task');
const TimeLog = require('./models/TimeLog');
const Invoice = require('./models/Invoice');

const userId = '6986117449b4b0eb3a795c9e';
const SAMPLE_CLIENT_EMAIL = 'mail.akgutaji@gmail.com';

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        console.log("Cleaning up...");
        const client = await Client.findOne({ email: SAMPLE_CLIENT_EMAIL, user: userId });
        if (client) {
            const projects = await Project.find({ client: client._id });
            const projectIds = projects.map(p => p._id);
            await Invoice.deleteMany({ client: client._id });
            await TimeLog.deleteMany({ project: { $in: projectIds } });
            await Task.deleteMany({ project: { $in: projectIds } });
            await Project.deleteMany({ client: client._id });
            await Client.findByIdAndDelete(client._id);
            console.log("Cleanup done");
        }

        console.log("Step 1: Creating Client...");
        const savedClient = await new Client({
            name: 'AK Corp.',
            email: SAMPLE_CLIENT_EMAIL,
            phone: '+917414908640',
            defaultHourlyRate: 1500,
            user: userId
        }).save();
        console.log("Client saved:", savedClient._id);

        console.log("Step 2: Creating Project...");
        const savedProject = await new Project({
            title: 'FreelanceFlow',
            description: 'Test',
            startDate: new Date('2026-02-01'),
            deadline: new Date('2026-02-01'),
            budget: 45000,
            hourlyRate: 1500,
            client: savedClient._id,
            createdBy: userId,
            status: 'in-progress'
        }).save();
        console.log("Project saved:", savedProject._id);

        console.log("Step 3: Creating Tasks...");
        await Task.insertMany([
            { title: 'Task 1', status: 'done', project: savedProject._id },
            { title: 'Task 2', status: 'todo', project: savedProject._id }
        ]);
        console.log("Tasks saved");

        console.log("Step 4: Creating Time Logs...");
        const savedLogs = await TimeLog.insertMany([
            {
                project: savedProject._id,
                user: userId,
                description: 'Log 1',
                startTime: new Date(),
                endTime: new Date(),
                durationHours: 1,
                status: 'paid',
                billed: true
            }
        ]);
        console.log("Logs saved");

        console.log("Step 5: Creating Invoice...");
        const inv = new Invoice({
            invoiceNumber: `INV-DEBUG-${Date.now()}`,
            project: savedProject._id,
            client: savedClient._id,
            freelancer: userId,
            items: [{ description: 'Log 1', hours: 1, hourlyRate: 1500, amount: 1500 }],
            logs: [savedLogs[0]._id],
            totalHours: 1,
            subtotal: 1500,
            totalAmount: 1500,
            status: 'paid',
            dueDate: new Date()
        });
        await inv.save();
        console.log("Invoice saved");

        console.log("SUCCESS");
    } catch (err) {
        console.error("FAILED AT STEP");
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();