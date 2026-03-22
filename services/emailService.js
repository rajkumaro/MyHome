const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const formatAmount = (cents) => `$${(cents / 100).toFixed(2)}`;
const formatDate = (date) => (date ? new Date(date).toLocaleDateString('en-US') : 'N/A');

/**
 * Send payment confirmation email to the client.
 * @param {string} to - recipient email
 * @param {Object} details - { invoiceNumber, serviceName, bookingDate, totalAmount, providerName }
 * @param {Buffer|undefined} pdfBuffer - optional invoice PDF attachment
 */
const sendPaymentConfirmation = async (to, details, pdfBuffer) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured — skipping payment confirmation email.');
    return;
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: `"MyHome" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Payment Confirmed — Invoice ${details.invoiceNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#635bff">Payment Confirmed ✓</h2>
        <p>Thank you for your payment. Your booking has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr style="background:#f3f4f6">
            <td style="padding:10px;font-weight:bold">Invoice #</td>
            <td style="padding:10px">${details.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold">Service</td>
            <td style="padding:10px">${details.serviceName}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:10px;font-weight:bold">Booking Date</td>
            <td style="padding:10px">${formatDate(details.bookingDate)}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold">Service Provider</td>
            <td style="padding:10px">${details.providerName}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:10px;font-weight:bold">Amount Paid</td>
            <td style="padding:10px;color:#065f46;font-weight:bold">${formatAmount(details.totalAmount)}</td>
          </tr>
        </table>
        <p>Please find your invoice attached.</p>
        <p style="color:#9ca3af;font-size:12px">MyHome — Service Provider Marketplace</p>
      </div>
    `,
    attachments: pdfBuffer
      ? [
          {
            filename: `invoice-${details.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      : []
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Notify service provider of a new paid booking.
 * @param {string} to
 * @param {Object} details - { clientName, serviceName, bookingDate, totalAmount, bookingId }
 */
const sendProviderNotification = async (to, details) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured — skipping provider notification email.');
    return;
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: `"MyHome" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New Booking Payment Received`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#635bff">New Booking Confirmed</h2>
        <p>A client has completed payment for your service.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr style="background:#f3f4f6">
            <td style="padding:10px;font-weight:bold">Client</td>
            <td style="padding:10px">${details.clientName}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold">Service</td>
            <td style="padding:10px">${details.serviceName}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:10px;font-weight:bold">Booking Date</td>
            <td style="padding:10px">${formatDate(details.bookingDate)}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold">Amount</td>
            <td style="padding:10px;color:#065f46;font-weight:bold">${formatAmount(details.totalAmount)}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:10px;font-weight:bold">Booking ID</td>
            <td style="padding:10px">${details.bookingId}</td>
          </tr>
        </table>
        <p style="color:#9ca3af;font-size:12px">MyHome — Service Provider Marketplace</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send refund notification email.
 * @param {string} to
 * @param {Object} details - { invoiceNumber, refundAmount, serviceName, reason }
 */
const sendRefundNotification = async (to, details) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured — skipping refund notification email.');
    return;
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: `"MyHome" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Refund Processed — Invoice ${details.invoiceNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#635bff">Refund Processed</h2>
        <p>Your refund has been processed successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr style="background:#f3f4f6">
            <td style="padding:10px;font-weight:bold">Invoice #</td>
            <td style="padding:10px">${details.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding:10px;font-weight:bold">Service</td>
            <td style="padding:10px">${details.serviceName}</td>
          </tr>
          <tr style="background:#f3f4f6">
            <td style="padding:10px;font-weight:bold">Refund Amount</td>
            <td style="padding:10px;color:#991b1b;font-weight:bold">${formatAmount(details.refundAmount)}</td>
          </tr>
          ${details.reason ? `<tr><td style="padding:10px;font-weight:bold">Reason</td><td style="padding:10px">${details.reason}</td></tr>` : ''}
        </table>
        <p>Please allow 5–10 business days for the funds to appear in your account.</p>
        <p style="color:#9ca3af;font-size:12px">MyHome — Service Provider Marketplace</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendPaymentConfirmation,
  sendProviderNotification,
  sendRefundNotification
};
