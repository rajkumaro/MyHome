const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');

/**
 * Generate a unique invoice number: INV-YYYYMMDD-XXXX
 */
const generateInvoiceNumber = () => {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${rand}`;
};

/**
 * Generate a PDF invoice and return a Buffer.
 * @param {object} invoice - Populated invoice document
 * @returns {Promise<Buffer>}
 */
const generatePDFInvoice = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryColor = '#2563EB';
    const grayColor = '#6B7280';
    const darkColor = '#111827';

    // ── Header / Branding ──────────────────────────────────────────────────
    doc
      .fontSize(28)
      .fillColor(primaryColor)
      .text('MyHome', 50, 50, { continued: true })
      .fontSize(12)
      .fillColor(grayColor)
      .text(' Service Provider Marketplace', { align: 'left' });

    doc
      .moveTo(50, 90)
      .lineTo(562, 90)
      .strokeColor(primaryColor)
      .lineWidth(2)
      .stroke();

    // ── Invoice Meta ───────────────────────────────────────────────────────
    doc
      .fontSize(22)
      .fillColor(darkColor)
      .text('INVOICE', 400, 50, { align: 'right' });

    doc.fontSize(10).fillColor(grayColor);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 400, 80, { align: 'right' });
    doc.text(
      `Date: ${new Date(invoice.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      400,
      93,
      { align: 'right' }
    );
    if (invoice.dueDate) {
      doc.text(
        `Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        400,
        106,
        { align: 'right' }
      );
    }

    // ── Bill From / Bill To ────────────────────────────────────────────────
    let y = 115;
    doc
      .fontSize(11)
      .fillColor(primaryColor)
      .text('Bill From:', 50, y)
      .fillColor(darkColor)
      .text(invoice.serviceProvider?.name || 'Service Provider', 50, y + 15)
      .fontSize(10)
      .fillColor(grayColor)
      .text(invoice.serviceProvider?.email || '', 50, y + 28)
      .text(invoice.serviceProvider?.phone || '', 50, y + 41);

    doc
      .fontSize(11)
      .fillColor(primaryColor)
      .text('Bill To:', 300, y)
      .fillColor(darkColor)
      .text(invoice.client?.name || 'Client', 300, y + 15)
      .fontSize(10)
      .fillColor(grayColor)
      .text(invoice.client?.email || '', 300, y + 28)
      .text(invoice.client?.phone || '', 300, y + 41);

    // ── Items Table ────────────────────────────────────────────────────────
    y += 75;
    doc
      .moveTo(50, y)
      .lineTo(562, y)
      .strokeColor('#E5E7EB')
      .lineWidth(1)
      .stroke();
    y += 8;

    // Table header
    doc.fontSize(10).fillColor(primaryColor);
    doc.text('Description', 50, y);
    doc.text('Qty', 320, y, { width: 50, align: 'right' });
    doc.text('Unit Price', 380, y, { width: 80, align: 'right' });
    doc.text('Total', 470, y, { width: 90, align: 'right' });
    y += 15;

    doc
      .moveTo(50, y)
      .lineTo(562, y)
      .strokeColor('#E5E7EB')
      .lineWidth(0.5)
      .stroke();
    y += 8;

    // Table rows
    doc.fillColor(darkColor);
    (invoice.items || []).forEach((item) => {
      doc.fontSize(10).text(item.description, 50, y, { width: 260 });
      doc.text(String(item.quantity), 320, y, { width: 50, align: 'right' });
      doc.text(`$${(item.unitPrice / 100).toFixed(2)}`, 380, y, { width: 80, align: 'right' });
      doc.text(`$${(item.total / 100).toFixed(2)}`, 470, y, { width: 90, align: 'right' });
      y += 20;
    });

    doc
      .moveTo(50, y)
      .lineTo(562, y)
      .strokeColor('#E5E7EB')
      .lineWidth(0.5)
      .stroke();
    y += 12;

    // ── Pricing Breakdown ──────────────────────────────────────────────────
    const labelX = 380;
    const valueX = 470;
    const colWidth = 90;

    doc.fontSize(10).fillColor(grayColor);
    doc.text('Subtotal:', labelX, y, { width: 80, align: 'right' });
    doc
      .fillColor(darkColor)
      .text(`$${(invoice.subtotal / 100).toFixed(2)}`, valueX, y, { width: colWidth, align: 'right' });
    y += 16;

    if (invoice.discounts && invoice.discounts.length > 0) {
      invoice.discounts.forEach((d) => {
        doc.fillColor(grayColor).text(d.description + ':', labelX, y, { width: 80, align: 'right' });
        doc
          .fillColor('#DC2626')
          .text(`-$${(d.amount / 100).toFixed(2)}`, valueX, y, { width: colWidth, align: 'right' });
        y += 16;
      });
    }

    doc.fillColor(grayColor).text(`Tax (${invoice.taxRate}%):`, labelX, y, { width: 80, align: 'right' });
    doc
      .fillColor(darkColor)
      .text(`$${(invoice.tax / 100).toFixed(2)}`, valueX, y, { width: colWidth, align: 'right' });
    y += 16;

    doc
      .moveTo(labelX, y)
      .lineTo(562, y)
      .strokeColor('#E5E7EB')
      .lineWidth(0.5)
      .stroke();
    y += 8;

    doc.fontSize(12).fillColor(primaryColor).text('Total:', labelX, y, { width: 80, align: 'right' });
    doc
      .fillColor(darkColor)
      .text(`$${(invoice.total / 100).toFixed(2)}`, valueX, y, { width: colWidth, align: 'right' });
    y += 28;

    // ── Payment Info ───────────────────────────────────────────────────────
    if (invoice.paymentMethod) {
      doc.fontSize(10).fillColor(grayColor).text(`Payment Method: ${invoice.paymentMethod}`, 50, y);
      y += 15;
    }
    if (invoice.paidDate) {
      doc
        .text(
          `Payment Date: ${new Date(invoice.paidDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
          50,
          y
        );
      y += 15;
    }

    // ── Notes ──────────────────────────────────────────────────────────────
    if (invoice.notes) {
      y += 10;
      doc.fontSize(10).fillColor(primaryColor).text('Notes:', 50, y);
      y += 14;
      doc.fillColor(grayColor).text(invoice.notes, 50, y, { width: 500 });
      y += 30;
    }

    // ── Terms ──────────────────────────────────────────────────────────────
    y += 10;
    doc
      .fontSize(9)
      .fillColor(grayColor)
      .text('Terms & Conditions', 50, y, { underline: true });
    y += 13;
    doc.text(
      'Payment is due within 30 days of invoice date. Late payments may incur additional charges. ' +
        'All services are subject to our Terms of Service available at myhome.app/terms.',
      50,
      y,
      { width: 500 }
    );

    // ── Footer ─────────────────────────────────────────────────────────────
    doc
      .moveTo(50, 750)
      .lineTo(562, 750)
      .strokeColor('#E5E7EB')
      .lineWidth(1)
      .stroke();
    doc
      .fontSize(9)
      .fillColor(grayColor)
      .text('MyHome Service Provider Marketplace  |  support@myhome.app  |  www.myhome.app', 50, 758, {
        align: 'center',
        width: 512,
      });

    doc.end();
  });
};

/**
 * Persist a new Invoice document in the database.
 * @param {string} bookingId
 * @param {string|null} transactionId
 * @param {object} invoiceData - Fields to populate
 */
const createInvoice = async (bookingId, transactionId, invoiceData) => {
  const invoiceNumber = generateInvoiceNumber();

  const invoice = new Invoice({
    invoiceNumber,
    bookingId,
    transactionId: transactionId || undefined,
    ...invoiceData,
  });

  await invoice.save();
  return invoice;
};

/**
 * Retrieve an invoice by booking ID with populated references.
 * @param {string} bookingId
 */
const getInvoiceByBookingId = async (bookingId) => {
  return Invoice.findOne({ bookingId })
    .populate('client', 'name email phone')
    .populate('serviceProvider', 'name email phone')
    .populate('transactionId')
    .populate('bookingId');
};

module.exports = {
  generateInvoiceNumber,
  generatePDFInvoice,
  createInvoice,
  getInvoiceByBookingId,
};
