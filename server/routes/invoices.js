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

// 1️⃣ GET ALL INVOICES (Transaction History)
router.get('/', verifyToken, async (req, res) => {
  try {
    const invoices = await Invoice.find({
      $or: [{ client: req.user.id }, { freelancer: req.user.id }]
    })
      .populate('project', 'title budget')
      .populate('client', 'name email')
      .populate('freelancer', 'name email')
      .populate('logs') // ✅ See the work details
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2️⃣ GET SINGLE INVOICE
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('project', 'title budget deadline')
      .populate('client', 'name email')
      .populate('freelancer', 'name email')
      .populate({
        path: 'logs',
        populate: { path: 'project', select: 'title' } // Deep populate to see project name in logs
      });

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

// 3️⃣ CREATE INVOICE (Granular - Selected Logs Only)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { projectId, freelancerId, logIds, amount, hours, date, status } = req.body;

    if (!projectId || !freelancerId || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const project = await Project.findById(projectId).populate('client');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const invoiceNumber = await generateInvoiceNumber();
    const invoiceStatus = status === 'paid' ? 'paid' : 'sent';

    // Create Invoice
    const newInvoice = new Invoice({
      invoiceNumber,
      project: projectId,
      client: project.client._id, // Payer (Project Owner)
      freelancer: freelancerId,   // Payee (Worker)
      totalAmount: amount,
      subtotal: amount,
      totalHours: hours,
      logs: logIds,               // ✅ Storing the specific IDs we selected
      dueDate: date || new Date(),
      status: invoiceStatus,
      paidDate: status === 'paid' ? new Date() : null,
      items: [],                  // Keeping empty as we use 'logs' array now
    });

    const savedInvoice = await newInvoice.save();

    // ✅ CRITICAL: Mark ONLY selected logs as Billed
    // This removes them from the "Pending Hours" list immediately
    if (logIds && logIds.length > 0) {
      const logStatus = status === 'paid' ? 'paid' : 'billed';

      await TimeLog.updateMany(
        { _id: { $in: logIds } },
        {
          $set: {
            billed: true,
            status: logStatus,
            invoice: savedInvoice._id
          }
        }
      );
    }

    res.status(201).json(savedInvoice);
  } catch (err) {
    console.error("Error creating invoice:", err);
    res.status(500).json(err);
  }
});

// 4️⃣ UPDATE INVOICE (Mark as Paid)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Authorization Check
    if (
      String(invoice.freelancer) !== String(req.user.id) &&
      String(invoice.client) !== String(req.user.id)
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status, paymentMethod, paidDate } = req.body;

    if (status) invoice.status = status;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (paidDate && status === 'paid') invoice.paidDate = paidDate;

    const updated = await invoice.save();

    // ✅ SYNC: If marked PAID, update the TimeLogs to 'paid' too
    if (status === 'paid' && invoice.logs && invoice.logs.length > 0) {
      await TimeLog.updateMany(
        { _id: { $in: invoice.logs } },
        { $set: { status: 'paid' } }
      );
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 5️⃣ DELETE INVOICE (Revert Billed Status)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Security: Only draft/sent invoices can be deleted, and only by involved parties
    if (String(invoice.freelancer) !== String(req.user.id) && String(invoice.client) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to delete' });
    }

    // ✅ FIXED: Look in 'logs' array, not just 'items'
    // This ensures logs reappear in "Pending Hours" if invoice is deleted
    const logsToRevert = invoice.logs || [];

    // Fallback for old invoices using 'items'
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach(item => {
        if (item.timeLogId) logsToRevert.push(item.timeLogId);
      });
    }

    if (logsToRevert.length > 0) {
      await TimeLog.updateMany(
        { _id: { $in: logsToRevert } },
        {
          billed: false,
          status: 'pending',
          $unset: { invoice: "" } // Remove the link
        }
      );
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json(err);
  }
});

module.exports = router;