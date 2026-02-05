require('dotenv').config();
const nodemailer = require('nodemailer');

const run = async () => {
    console.log("User:", process.env.EMAIL_USER);
    console.log("Pass:", process.env.EMAIL_PASS ? "****" : "MISSING");

    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 2525,
        secure: false, // STARTTLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter.sendMail({
            from: `"Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: "Test Email",
            text: "Hello world"
        });
        console.log("✅ Email Sent via Brevo");
    } catch (e) {
        console.log("❌ Brevo Failed:", e.message);
    }

    // Try Gmail settings just in case
    const gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        await gmailTransporter.sendMail({
            from: `"Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "Test Email Gmail",
            text: "Hello world Gmail"
        });
        console.log("✅ Email Sent via Gmail Service");
    } catch (e) {
        console.log("❌ Gmail Failed:", e.message);
    }
};

run();
