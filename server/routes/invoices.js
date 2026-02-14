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
      $or: [{ client: req.user.id }, { freelancer: req.user.id }]
    })
      .populate('project', 'title budget')
      .populate('client', 'name email mobile phone')
      .populate('freelancer', 'name email mobile phone')
      .populate('logs')
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
      .populate('client', 'name email mobile phone')
      .populate('freelancer', 'name email mobile phone')
      .populate({
        path: 'logs',
        populate: { path: 'project', select: 'title' }
      });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

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

    const newInvoice = new Invoice({
      invoiceNumber,
      project: projectId,
      client: project.client._id,
      freelancer: freelancerId,
      totalAmount: amount,
      subtotal: amount,
      totalHours: hours,
      logs: logIds,
      dueDate: date || new Date(),
      status: invoiceStatus,
      paidDate: status === 'paid' ? new Date() : null,
      items: [],
    });

    const savedInvoice = await newInvoice.save();

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

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

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

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    if (String(invoice.freelancer) !== String(req.user.id) && String(invoice.client) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to delete' });
    }

    const logsToRevert = invoice.logs || [];

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
          $unset: { invoice: "" }
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