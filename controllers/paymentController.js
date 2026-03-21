const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { stripeConfig } = require('../config/stripe');
const stripeService = require('../services/stripeService');
const invoiceService = require('../services/invoiceService');
const emailService = require('../services/emailService');

// ─── POST /api/payments/create-intent ────────────────────────────────────────
const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('service', 'title price')
      .populate('serviceProvider', 'name email')
      .populate('client', 'name email');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Only the booking's client may pay
    if (booking.client._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorised to pay for this booking' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Booking is already paid' });
    }

    // Amount in cents; prefer body amount over stored price
    const amountInCents = amount || Math.round(booking.totalPrice * 100);

    const paymentIntent = await stripeService.createPaymentIntent(
      amountInCents,
      stripeConfig.currency,
      {
        bookingId: bookingId.toString(),
        clientId: req.user.id,
        serviceId: booking.service._id.toString(),
      }
    );

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      publicKey: stripeConfig.publicKey,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      currency: stripeConfig.currency,
    });
  } catch (err) {
    console.error('createPaymentIntent error:', err.message);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// ─── POST /api/payments/process ───────────────────────────────────────────────
const processPayment = async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId, bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('service', 'title price')
      .populate('serviceProvider', 'name email')
      .populate('client', 'name email');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Booking is already paid' });
    }

    // Retrieve the payment intent to get the latest status and charge
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: `Payment not succeeded. Current status: ${paymentIntent.status}` });
    }

    const chargeId =
      typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id || '';

    // Update booking payment status
    booking.paymentStatus = 'paid';
    await booking.save();

    // Create transaction record
    const invoiceNumber = invoiceService.generateInvoiceNumber();

    const transaction = await Transaction.create({
      bookingId,
      userId: req.user.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      cardLast4: paymentMethodId,
      status: 'succeeded',
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId,
      metadata: { invoiceNumber },
    });

    // Build invoice data
    const amountInCents = paymentIntent.amount;
    const invoiceItems = [
      {
        description: booking.service.title,
        quantity: 1,
        unitPrice: amountInCents,
        total: amountInCents,
      },
    ];

    const invoice = await invoiceService.createInvoice(bookingId, transaction._id, {
      serviceProvider: booking.serviceProvider._id,
      client: booking.client._id,
      items: invoiceItems,
      subtotal: amountInCents,
      taxRate: 0,
      tax: 0,
      total: amountInCents,
      paymentMethod: paymentMethodId,
      status: 'paid',
      paidDate: new Date(),
      invoiceNumber,
      dueDate: new Date(),
    });

    // Populate invoice for PDF generation
    const populatedInvoice = await invoiceService.getInvoiceByBookingId(bookingId);

    // Generate PDF and send email (non-blocking failure)
    try {
      const pdfBuffer = await invoiceService.generatePDFInvoice(populatedInvoice);
      await emailService.sendPaymentConfirmation(
        booking.client.email,
        {
          invoiceNumber,
          serviceName: booking.service.title,
          bookingDate: booking.bookingDate,
          totalAmount: amountInCents,
          providerName: booking.serviceProvider.name,
        },
        pdfBuffer
      );

      await emailService.sendProviderNotification(booking.serviceProvider.email, {
        clientName: booking.client.name,
        serviceName: booking.service.title,
        bookingDate: booking.bookingDate,
        totalAmount: amountInCents,
        bookingId: bookingId.toString(),
      });
    } catch (emailErr) {
      console.error('Email/PDF error (non-fatal):', emailErr.message);
    }

    return res.status(200).json({
      message: 'Payment processed successfully',
      transactionId: transaction._id,
      invoiceNumber,
    });
  } catch (err) {
    console.error('processPayment error:', err.message);
    return res.status(500).json({ error: 'Failed to process payment' });
  }
};

// ─── GET /api/payments/history ────────────────────────────────────────────────
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, dateFrom, dateTo, status } = req.query;

    const filter = { userId: req.user.id };

    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Transaction.countDocuments(filter);

    const transactions = await Transaction.find(filter)
      .populate('bookingId', 'bookingDate status service')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.status(200).json({
      transactions,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error('getPaymentHistory error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve payment history' });
  }
};

// ─── GET /api/payments/invoice/:bookingId ─────────────────────────────────────
const getInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const invoice = await invoiceService.getInvoiceByBookingId(bookingId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Ensure requesting user is client or service provider on this invoice
    const userId = req.user.id;
    const clientId = invoice.client?._id?.toString();
    const providerId = invoice.serviceProvider?._id?.toString();
    if (userId !== clientId && userId !== providerId) {
      return res.status(403).json({ error: 'Not authorised to view this invoice' });
    }

    const pdfBuffer = await invoiceService.generatePDFInvoice(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error('getInvoice error:', err.message);
    return res.status(500).json({ error: 'Failed to generate invoice' });
  }
};

// ─── POST /api/payments/refund ────────────────────────────────────────────────
const refundPayment = async (req, res) => {
  try {
    const { bookingId, reason, amount } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('client', 'name email')
      .populate('service', 'title');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Only paid bookings can be refunded' });
    }

    const transaction = await Transaction.findOne({ bookingId, status: 'succeeded' });
    if (!transaction) {
      return res.status(404).json({ error: 'No successful transaction found for this booking' });
    }

    if (!transaction.stripeChargeId) {
      return res.status(400).json({ error: 'No charge ID found for this transaction' });
    }

    const refund = await stripeService.createRefund(
      transaction.stripeChargeId,
      amount || undefined
    );

    const refundAmount = refund.amount;

    // Update records
    transaction.status = 'refunded';
    await transaction.save();

    booking.paymentStatus = 'refunded';
    await booking.save();

    // Find invoice for notification details
    const invoice = await invoiceService.getInvoiceByBookingId(bookingId);

    // Send refund email (non-blocking)
    try {
      await emailService.sendRefundNotification(booking.client.email, {
        invoiceNumber: invoice?.invoiceNumber || transaction._id.toString(),
        refundAmount,
        serviceName: booking.service.title,
        reason,
      });
    } catch (emailErr) {
      console.error('Refund email error (non-fatal):', emailErr.message);
    }

    return res.status(200).json({
      message: 'Refund processed successfully',
      refundId: refund.id,
      refundAmount,
    });
  } catch (err) {
    console.error('refundPayment error:', err.message);
    return res.status(500).json({ error: 'Failed to process refund' });
  }
};

// ─── POST /api/payments/webhook ───────────────────────────────────────────────
const handleWebhook = async (req, res) => {
  const stripeWebhookHandler = require('../webhooks/stripeWebhook');
  return stripeWebhookHandler(req, res);
};

module.exports = {
  createPaymentIntent,
  processPayment,
  getPaymentHistory,
  getInvoice,
  refundPayment,
  handleWebhook,
};
