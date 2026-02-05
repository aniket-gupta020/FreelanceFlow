require('dotenv').config();
const nodemailer = require('nodemailer');

console.log("Checking EMAIL_USER:", process.env.EMAIL_USER ? "SET" : "NOT SET");
console.log("Checking EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    family: 4,
    logger: true,
    debug: true
});

transporter.verify(function (error, success) {
    if (error) {
        console.log("❌ Connection Error:", error);
    } else {
        console.log("✅ Server is ready to take our messages");
    }
});
