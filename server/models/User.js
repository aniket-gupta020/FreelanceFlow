const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['freelancer', 'client'],
    default: 'freelancer'
  },
  bio: {
    type: String,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  defaultHourlyRate: {
    type: Number,
    default: 0
  },
  subscription: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);