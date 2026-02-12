const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  deadline: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'client',
    required: true
  },
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed'],
    default: 'open'
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });
module.exports = mongoose.model('Project', ProjectSchema);