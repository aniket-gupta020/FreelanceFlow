const nodemailer = require('nodemailer');

// 🔵 BREVO CONFIGURATION (Port 2525)
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525, // Using Port 2525 to bypass potential blocking
    secure: false, // STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    family: 4, // Forces IPv4
    logger: true,
    debug: true,
    connectionTimeout: 5000
});

/**
 * Generates the Glassmorphism HTML Email Template
 * @param {string} otp - The OTP code to display
 * @param {string} type - The type of email ('register', 'forgot_password', 'update_email', 'passwordless')
 * @returns {object} - Contains { subject, html }
 */
const getEmailTemplate = (otp, type) => {
    let subject = 'FreelanceFlow - Verification Code';
    let message = 'Use the code below to verify your account.';
    let title = 'FreelanceFlow';

    switch (type) {
        case 'register':
            subject = 'FreelanceFlow - Welcome! Verify your email';
            message = 'Welcome to the future. Use the code below to verify your account.';
            break;
        case 'forgot_password':
            subject = 'FreelanceFlow - Reset your password';
            message = 'We received a request to reset your password. Use the code below.';
            title = 'Reset Password';
            break;
        case 'update_email':
            subject = 'FreelanceFlow - Verify your new email';
            message = 'Please verify your new email address with the code below.';
            break;
        case 'passwordless':
            subject = 'FreelanceFlow - Secure Login';
            message = 'Here is your secure login verification code.';
            title = 'Secure Login';
            break;
        default:
            break;
    }

    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); background-color: #0f0c29; padding: 50px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #ffffff; margin-bottom: 20px; font-size: 24px; font-weight: 600;">${title}</h2>
        <p style="color: #e0e0e0; font-size: 16px; margin-bottom: 30px; line-height: 1.6;">
          ${message}
        </p>
        <div style="font-size: 40px; font-weight: 800; color: #ffffff; letter-spacing: 5px; text-shadow: 0 0 15px rgba(255, 255, 255, 0.7); margin: 30px 0;">
          ${otp}
        </div>
        <p style="color: #a0a0a0; font-size: 12px; margin-top: 40px;">
          This code expires in 10 minutes.
        </p>
      </div>
    </div>
  `;

    return { subject, html };
};

/**
 * Sends an OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} type - 'register' | 'forgot_password' | 'update_email' | 'passwordless'
 */
const sendEmail = async (email, otp, type = 'register') => {
    const { subject, html } = getEmailTemplate(otp, type);

    const mailOptions = {
        from: `"FreelanceFlow" <mail.akguptaji@gmail.com>`,
        to: email,
        subject: subject,
        html: html
    };

    try {
        console.log(`📨 Sending (${type}) email to ${email} via Port 2525...`);
        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully!");
        return true;
    } catch (err) {
        console.error("❌ Email Sending Error:", err);
        throw err;
    }
};

module.exports = { sendEmail };
