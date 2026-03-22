const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');

/**
 * Generate a unique invoice number.
 */
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
};

/**
 * Create and persist a new invoice record.
 * @param {string} bookingId
 * @param {string} transactionId
 * @param {Object} data
 */
const createInvoice = async (bookingId, transactionId, data) => {
  const invoice = await Invoice.create({
    bookingId,
    transactionId,
    serviceProvider: data.serviceProvider,
    client: data.client,
    items: data.items || [],
    subtotal: data.subtotal,
    taxRate: data.taxRate || 0,
    tax: data.tax || 0,
    total: data.total,
    discounts: data.discounts || [],
    paymentMethod: data.paymentMethod || '',
    status: data.status || 'paid',
    dueDate: data.dueDate || new Date(),
    paidDate: data.paidDate,
    invoiceNumber: data.invoiceNumber || generateInvoiceNumber(),
    notes: data.notes || ''
  });
  return invoice;
};

/**
 * Retrieve an invoice for a given booking, populated with references.
 * @param {string} bookingId
 */
const getInvoiceByBookingId = async (bookingId) => {
  return Invoice.findOne({ bookingId })
    .populate('client', 'name email address phone')
    .populate('serviceProvider', 'name email address phone')
    .populate('bookingId', 'bookingDate totalPrice notes');
};

/**
 * Generate a PDF for an invoice and return as a Buffer.
 * @param {Object} invoice - populated invoice document
 */
const generatePDFInvoice = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const formatAmount = (cents) => `$${(cents / 100).toFixed(2)}`;
      const formatDate = (date) =>
        date ? new Date(date).toLocaleDateString('en-US') : 'N/A';

      // ─── Header ───────────────────────────────────────────────────────────
      doc
        .fillColor('#635bff')
        .fontSize(26)
        .font('Helvetica-Bold')
        .text('MyHome', 50, 50);

      doc
        .fillColor('#6b7280')
        .fontSize(10)
        .font('Helvetica')
        .text('Service Provider Marketplace', 50, 82);

      doc
        .fillColor('#1a1a2e')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', 400, 50, { align: 'right' });

      doc
        .fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text(`Invoice #: ${invoice.invoiceNumber || 'N/A'}`, 400, 80, { align: 'right' })
        .text(`Date: ${formatDate(invoice.createdAt)}`, 400, 95, { align: 'right' })
        .text(
          `Due Date: ${invoice.dueDate ? formatDate(invoice.dueDate) : 'Upon receipt'}`,
          400,
          110,
          { align: 'right' }
        );

      doc.moveDown(3);

      // ─── Divider ──────────────────────────────────────────────────────────
      doc.strokeColor('#635bff').lineWidth(2).moveTo(50, 135).lineTo(545, 135).stroke();

      // ─── Bill To / From ───────────────────────────────────────────────────
      const billY = 155;
      doc.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text('BILL TO', 50, billY);
      doc
        .fillColor('#1a1a2e')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(invoice.client?.name || 'N/A', 50, billY + 15);
      doc
        .fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text(invoice.client?.email || '', 50, billY + 30)
        .text(invoice.client?.address || '', 50, billY + 45);

      doc.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold').text('SERVICE PROVIDER', 320, billY);
      doc
        .fillColor('#1a1a2e')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(invoice.serviceProvider?.name || 'N/A', 320, billY + 15);
      doc
        .fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text(invoice.serviceProvider?.email || '', 320, billY + 30)
        .text(invoice.serviceProvider?.address || '', 320, billY + 45);

      // ─── Items Table ──────────────────────────────────────────────────────
      const tableTop = billY + 90;
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, tableTop - 5).lineTo(545, tableTop - 5).stroke();

      doc
        .fillColor('#374151')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('DESCRIPTION', 50, tableTop)
        .text('QTY', 330, tableTop, { width: 50, align: 'center' })
        .text('UNIT PRICE', 380, tableTop, { width: 80, align: 'right' })
        .text('TOTAL', 460, tableTop, { width: 85, align: 'right' });

      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, tableTop + 18).lineTo(545, tableTop + 18).stroke();

      let itemY = tableTop + 28;
      const items = invoice.items || [];

      if (items.length === 0) {
        doc
          .fillColor('#374151')
          .fontSize(10)
          .font('Helvetica')
          .text('Service charges', 50, itemY)
          .text('1', 330, itemY, { width: 50, align: 'center' })
          .text(formatAmount(invoice.subtotal), 380, itemY, { width: 80, align: 'right' })
          .text(formatAmount(invoice.subtotal), 460, itemY, { width: 85, align: 'right' });
        itemY += 22;
      } else {
        items.forEach((item) => {
          doc
            .fillColor('#374151')
            .fontSize(10)
            .font('Helvetica')
            .text(item.description || '', 50, itemY, { width: 270 })
            .text(String(item.quantity || 1), 330, itemY, { width: 50, align: 'center' })
            .text(formatAmount(item.unitPrice || 0), 380, itemY, { width: 80, align: 'right' })
            .text(formatAmount(item.total || 0), 460, itemY, { width: 85, align: 'right' });
          itemY += 22;
        });
      }

      // ─── Totals ───────────────────────────────────────────────────────────
      const totalsY = itemY + 15;
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(350, totalsY - 5).lineTo(545, totalsY - 5).stroke();

      doc
        .fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text('Subtotal:', 350, totalsY, { width: 110 })
        .text(formatAmount(invoice.subtotal || 0), 460, totalsY, { width: 85, align: 'right' });

      doc
        .text(`Tax (${invoice.taxRate || 0}%):`, 350, totalsY + 18, { width: 110 })
        .text(formatAmount(invoice.tax || 0), 460, totalsY + 18, { width: 85, align: 'right' });

      doc.strokeColor('#635bff').lineWidth(1.5).moveTo(350, totalsY + 38).lineTo(545, totalsY + 38).stroke();

      doc
        .fillColor('#1a1a2e')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('TOTAL:', 350, totalsY + 46, { width: 110 })
        .text(formatAmount(invoice.total || 0), 460, totalsY + 46, { width: 85, align: 'right' });

      // ─── Payment Info ─────────────────────────────────────────────────────
      if (invoice.status === 'paid') {
        const paidY = totalsY + 80;
        doc
          .fillColor('#065f46')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(
            `PAID on ${formatDate(invoice.paidDate)}${invoice.paymentMethod ? ` via ${invoice.paymentMethod}` : ''}`,
            50,
            paidY
          );
      }

      // ─── Notes ────────────────────────────────────────────────────────────
      if (invoice.notes) {
        const notesY = totalsY + 100;
        doc
          .fillColor('#6b7280')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('NOTES', 50, notesY);
        doc
          .fillColor('#374151')
          .fontSize(9)
          .font('Helvetica')
          .text(invoice.notes, 50, notesY + 14, { width: 495 });
      }

      // ─── Footer ───────────────────────────────────────────────────────────
      doc
        .fillColor('#9ca3af')
        .fontSize(8)
        .font('Helvetica')
        .text('Thank you for using MyHome. For support, contact support@myhome.com', 50, 760, {
          align: 'center',
          width: 495
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateInvoiceNumber,
  createInvoice,
  getInvoiceByBookingId,
  generatePDFInvoice
};
