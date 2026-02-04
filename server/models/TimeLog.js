const mongoose = require('mongoose');

const TimeLogSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  durationHours: {
    type: Number,
    default: 0
  },
  billed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('TimeLog', TimeLogSchema);