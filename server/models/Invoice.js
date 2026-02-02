const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    description: String,
    hours: Number,
    hourlyRate: Number,
    amount: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  taxPercentage: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue'],
    default: 'draft'
  },
  dueDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: 'pending'
  },
  paidDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
