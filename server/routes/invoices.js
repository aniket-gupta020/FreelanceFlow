const router = require('express').Router();
const Invoice = require('../models/Invoice');
const Project = require('../models/Project');
const TimeLog = require('../models/TimeLog');
const verifyToken = require('../middleware/verifyToken');

const generateInvoiceNumber = async () => {
  const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
  const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) : 0;
  return `INV-${String(lastNumber + 1).padStart(5, '0')}`;
};

router.get('/', verifyToken, async (req, res) => {
  try {
    const invoices = await Invoice.find({
      $or: [
        { freelancer: req.user.id },
        { client: req.user.id }
      ]
    })
      .populate('project', 'title budget')
      .populate('client', 'name email')
      .populate('freelancer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('project', 'title budget deadline')
      .populate('client', 'name email')
      .populate('freelancer', 'name email');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Check authorization
    if (
      String(invoice.freelancer._id) !== String(req.user.id) &&
      String(invoice.client._id) !== String(req.user.id)
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.status(200).json(invoice);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { projectId, clientId, items, taxPercentage, notes, dueDate } = req.body;
    if (!projectId || !clientId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const project = await Project.findById(projectId).populate('client');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = taxPercentage ? (subtotal * taxPercentage) / 100 : 0;
    const totalAmount = subtotal + tax;

    const invoiceNumber = await generateInvoiceNumber();

    const newInvoice = new Invoice({
      invoiceNumber,
      project: projectId,
      client: clientId,
      freelancer: req.user.id,
      items,
      subtotal,
      taxPercentage: taxPercentage || 0,
      taxAmount: tax,
      totalAmount,
      notes,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
    });

    const savedInvoice = await newInvoice.save();

    const timeLogIds = items
      .filter(item => item.timeLogId)
      .map(item => item.timeLogId);

    if (timeLogIds.length > 0) {
      await TimeLog.updateMany(
        { _id: { $in: timeLogIds } },
        { billed: true }
      );
    }

    res.status(200).json(savedInvoice);
  } catch (err) {
    res.status(500).json(err);
  }
});


// ✅ NEW: CREATE & RECORD INVOICE (Transaction-like)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { projectId, freelancerId, logIds, amount, hours, date } = req.body;

    if (!projectId || !freelancerId || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const project = await Project.findById(projectId).populate('client');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const invoiceNumber = await generateInvoiceNumber();

    // Create Invoice
    const newInvoice = new Invoice({
      invoiceNumber,
      project: projectId,
      client: project.client._id, // Bill From Project Owner
      freelancer: freelancerId,   // Bill To Freelancer
      totalAmount: amount,
      subtotal: amount,           // For now assuming no tax logic in this flow unless specified
      totalHours: hours,
      logs: logIds,
      dueDate: date || new Date(), // Immediate record
      status: 'sent',              // It's a record of a generated statement
      items: [],                   // Optional: could populate from logs if needed, but keeping simple for now
    });

    const savedInvoice = await newInvoice.save();

    // Update TimeLogs
    if (logIds && logIds.length > 0) {
      await TimeLog.updateMany(
        { _id: { $in: logIds } },
        { $set: { billed: true } }
      );
    }

    res.status(201).json(savedInvoice);
  } catch (err) {
    console.error("Error creating invoice:", err);
    res.status(500).json(err);
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Check authorization (only freelancer can update)
    if (String(invoice.freelancer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status, paymentMethod, paidDate } = req.body;

    if (status) invoice.status = status;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (paidDate && status === 'paid') invoice.paidDate = paidDate;

    const updated = await invoice.save();
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Only allow deletion if draft and freelancer owns it
    if (invoice.status !== 'draft' || String(invoice.freelancer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Can only delete draft invoices' });
    }

    // Unmark time logs as billed
    const timeLogIds = invoice.items
      .filter(item => item.timeLogId)
      .map(item => item.timeLogId);

    if (timeLogIds.length > 0) {
      await TimeLog.updateMany(
        { _id: { $in: timeLogIds } },
        { billed: false }
      );
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/project/:projectId/unbilled', verifyToken, async (req, res) => {
  try {
    const timeLogs = await TimeLog.find({
      project: req.params.projectId,
      billed: false,
      user: req.user.id
    }).populate('project', 'title budget hourlyRate defaultHourlyRate');

    res.status(200).json(timeLogs);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
