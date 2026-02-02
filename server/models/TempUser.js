const mongoose = require('mongoose');

const TempUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    registrationData: {
        name: { type: String, required: true },
        password: { type: String, required: true }, // Hashed password
        role: { type: String, default: 'freelancer' },
        defaultHourlyRate: { type: Number, default: 0 },
        subscription: { type: String, default: 'free' }
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600
    }
}, { collection: 'temp_pending_users' });

module.exports = mongoose.model('TempUser', TempUserSchema);
