const nodemailer = require('nodemailer');

// 🔵 BREVO / SMTP CONFIGURATION (Cloud-Proof - Nuclear Option ☢️)
const transporter = nodemailer.createTransport({
    // 🛑 FORCE HOST & PORT (No more guessing)
    host: 'smtp-relay.brevo.com',  // Hardcoded to ensure it hits Brevo
    port: 587,                     // Hardcoded to Standard Port (Bypasses Render Block)
    secure: false,                 // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER, // Your Brevo Login
        pass: process.env.EMAIL_PASS  // Your Brevo API Key
    },
    // 🛡️ NETWORK HARDENING (The "IPv6 Bug" Fix)
    family: 4,                // Force IPv4 (Critical for Render)
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,    // 5 seconds
    socketTimeout: 10000,     // 10 seconds
    dnsTimeout: 5000,         // 5 seconds

    // 🔍 DEBUGGING
    debug: true,
    logger: true,

    // 🔒 TLS SETTINGS (Prevents "Self-Signed" errors)
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    }
});

/**
 * Generates the Glassmorphism HTML Email Template with DYNAMIC COLORS
 * @param {string} otp - The OTP code to display
 * @param {string} type - The type of email
 * @returns {object} - Contains { subject, html }
 */
const getEmailTemplate = (otp, type) => {
    // Default Configuration (Purple/Dark - "Welcome" vibe)
    let config = {
        subject: 'FreelanceFlow - Verification Code',
        title: 'FreelanceFlow',
        message: 'Use the code below to verify your account.',
        bgGradient: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', // Deep Purple
        boxBorder: 'rgba(255, 255, 255, 0.2)',
        textColor: '#ffffff'
    };

    // 🎨 APPLY THEMES BASED ON ACTION
    switch (type) {
        // 🔴 DANGER ZONE (Red)
        case 'delete_account':
            config.subject = '⚠️ Confirm Account Deletion';
            config.title = 'Delete Account';
            config.message = 'You have requested to <strong style="color: #ffcccc;">permanently delete</strong> your account. This cannot be undone.';
            config.bgGradient = 'linear-gradient(135deg, #4a0404, #991b1b, #ef4444)'; // Dark Red to Red
            break;

        // 🟢 SECURITY / LOGIN (Green/Teal)
        case 'login_otp':
        case 'passwordless':
            config.subject = '🔐 FreelanceFlow - Secure Login Code';
            config.title = 'Secure Login';
            config.message = 'We detected a login attempt. Use this code to securely access your account.';
            config.bgGradient = 'linear-gradient(135deg, #064e3b, #059669, #34d399)'; // Forest to Emerald
            break;

        // 🔵 UPDATE / RESET (Blue)
        case 'forgot_password':
            config.subject = '🔑 FreelanceFlow - Reset Password';
            config.title = 'Reset Password';
            config.message = 'We received a request to reset your password. If this wasn\'t you, please ignore this email.';
            config.bgGradient = 'linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa)'; // Navy to Blue
            break;

        case 'update_email':
            config.subject = '📧 Verify New Email';
            config.title = 'Verify Email';
            config.message = 'Please verify your new email address to complete the update.';
            config.bgGradient = 'linear-gradient(135deg, #0c4a6e, #0284c7, #38bdf8)'; // Cyan/Sky
            break;

        // 🟡 PROFILE CHANGES (Orange/Gold)
        case 'profile_update':
            config.subject = '🛡️ Confirm Profile Changes';
            config.title = 'Security Update';
            config.message = 'Use the code below to confirm changes to your account security settings.';
            config.bgGradient = 'linear-gradient(135deg, #78350f, #d97706, #fbbf24)'; // Amber/Gold
            break;

        // 🟣 REGISTER (Standard Purple)
        case 'register':
        default:
            config.subject = '🚀 Welcome! Verify your email';
            config.title = 'Welcome to FreelanceFlow';
            config.message = 'Welcome to the future of work. Use the code below to activate your account.';
            config.bgGradient = 'linear-gradient(135deg, #2e1065, #7c3aed, #a78bfa)'; // Deep Violet
            break;
    }

    const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: ${config.bgGradient}; padding: 50px 20px; text-align: center; min-height: 400px;">
      <div style="max-width: 500px; margin: 0 auto; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid ${config.boxBorder}; border-radius: 24px; padding: 40px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);">
        
        <h2 style="color: #ffffff; margin-bottom: 20px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${config.title}</h2>
        
        <p style="color: #e0e0e0; font-size: 16px; margin-bottom: 30px; line-height: 1.6;">
          ${config.message}
        </p>
        
        <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 15px; display: inline-block; margin: 20px 0;">
            <div style="font-size: 42px; font-weight: 800; color: #ffffff; letter-spacing: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); font-family: monospace;">
            ${otp}
            </div>
        </div>

        <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 30px;">
          This code expires in 10 minutes. <br>
          If you didn't request this, please ignore this email.
        </p>
      </div>
      
      <div style="margin-top: 30px; color: rgba(255,255,255,0.5); font-size: 12px;">
        &copy; ${new Date().getFullYear()} FreelanceFlow. All rights reserved.
      </div>
    </div>
  `;

    return { subject: config.subject, html };
};

/**
 * Sends an OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} type - 'register' | 'forgot_password' | 'update_email' | 'passwordless' | 'delete_account'
 */
const sendEmail = async (email, otp, type = 'register') => {
    // 🛑 UPDATED: Use the configured Brevo user as the sender
    const SENDER_EMAIL = process.env.EMAIL_USER;

    const { subject, html } = getEmailTemplate(otp, type);
    console.log("🔑 DEBUG OTP:", otp);
    console.log(`📧 DEBUG EMAIL [${type}]: Subject="${subject}"`);

    const mailOptions = {
        from: `"FreelanceFlow" <${SENDER_EMAIL}>`, // Use Env Var
        to: email,
        subject: subject,
        html: html
    };

    try {
        console.log(`📨 Sending (${type}) email to ${email} via Port 587 (IPv4)...`);
        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully!");
        return true;
    } catch (err) {
        console.error("❌ Email Sending Error:", err);
        throw err;
    }
};

// ✅ THE FIX IS HERE: Use curly braces to export as an object
module.exports = { sendEmail };