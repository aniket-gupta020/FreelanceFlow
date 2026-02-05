require('dotenv').config();
const { sendEmail } = require('./utils/emailService');

const run = async () => {
    try {
        console.log("Testing updated emailService...");
        await sendEmail(process.env.EMAIL_USER, '123456', 'register');
        console.log("✅ Verification Successful: Email sent via updated service.");
    } catch (e) {
        console.log("❌ Verification Failed:", e.message);
    }
};

run();
