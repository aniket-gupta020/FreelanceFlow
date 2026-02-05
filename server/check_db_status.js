require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
// Assuming Project model is in models/Project.js, need to verify path
const Project = require('./models/Project');

const run = async () => {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        const userCount = await User.countDocuments();
        console.log(`👤 Users Count: ${userCount}`);

        try {
            const projectCount = await Project.countDocuments();
            console.log(`📂 Projects Count: ${projectCount}`);
        } catch (e) {
            console.log("⚠️ Could not count projects (Model might be named differently or missing):", e.message);
        }

    } catch (err) {
        console.error("❌ ERROR:", err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
