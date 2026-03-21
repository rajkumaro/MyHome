const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a payment confirmation email with the PDF invoice attached.
 * @param {string} to - Recipient email
 * @param {object} bookingDetails
 * @param {Buffer} invoiceBuffer - PDF buffer
 */
const sendPaymentConfirmation = async (to, bookingDetails, invoiceBuffer) => {
  const { invoiceNumber, serviceName, bookingDate, totalAmount, providerName } = bookingDetails;

  const mailOptions = {
    from: `"MyHome" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Payment Confirmation – ${invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563EB; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">MyHome</h1>
          <p style="color: #BFDBFE; margin: 4px 0 0;">Service Provider Marketplace</p>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #111827;">Payment Confirmed ✓</h2>
          <p style="color: #6B7280;">Thank you for your payment. Your booking has been confirmed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Invoice #</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600; border-bottom: 1px solid #F3F4F6;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Service</td>
              <td style="padding: 8px 0; color: #111827; border-bottom: 1px solid #F3F4F6;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Provider</td>
              <td style="padding: 8px 0; color: #111827; border-bottom: 1px solid #F3F4F6;">${providerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Booking Date</td>
              <td style="padding: 8px 0; color: #111827; border-bottom: 1px solid #F3F4F6;">${new Date(bookingDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">Total Paid</td>
              <td style="padding: 8px 0; color: #2563EB; font-weight: 700; font-size: 18px;">$${(totalAmount / 100).toFixed(2)}</td>
            </tr>
          </table>
          <p style="color: #6B7280; font-size: 14px;">Your invoice is attached to this email.</p>
        </div>
        <div style="background: #F9FAFB; padding: 16px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            MyHome Service Provider Marketplace &nbsp;|&nbsp; support@myhome.app
          </p>
        </div>
      </div>
    `,
    attachments: invoiceBuffer
      ? [
          {
            filename: `${invoiceNumber}.pdf`,
            content: invoiceBuffer,
            contentType: 'application/pdf',
          },
        ]
      : [],
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send a refund notification email.
 * @param {string} to
 * @param {object} refundDetails
 */
const sendRefundNotification = async (to, refundDetails) => {
  const { invoiceNumber, refundAmount, serviceName, reason } = refundDetails;

  const mailOptions = {
    from: `"MyHome" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Refund Processed – ${invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563EB; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">MyHome</h1>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #111827;">Refund Processed</h2>
          <p style="color: #6B7280;">Your refund has been initiated and should appear in 5–10 business days.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Invoice #</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600; border-bottom: 1px solid #F3F4F6;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Service</td>
              <td style="padding: 8px 0; color: #111827; border-bottom: 1px solid #F3F4F6;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Reason</td>
              <td style="padding: 8px 0; color: #111827; border-bottom: 1px solid #F3F4F6;">${reason || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">Refund Amount</td>
              <td style="padding: 8px 0; color: #2563EB; font-weight: 700; font-size: 18px;">$${(refundAmount / 100).toFixed(2)}</td>
            </tr>
          </table>
        </div>
        <div style="background: #F9FAFB; padding: 16px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            MyHome Service Provider Marketplace &nbsp;|&nbsp; support@myhome.app
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send a new booking notification to the service provider.
 * @param {string} to
 * @param {object} bookingDetails
 */
const sendProviderNotification = async (to, bookingDetails) => {
  const { clientName, serviceName, bookingDate, totalAmount, bookingId } = bookingDetails;

  const mailOptions = {
    from: `"MyHome" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New Booking Received – ${serviceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563EB; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">MyHome</h1>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #111827;">New Booking 🎉</h2>
          <p style="color: #6B7280;">You have received a new booking. Please confirm at your earliest convenience.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr>
              <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Booking ID</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600; border-bottom: 1px solid #F3F4F6;">${bookingId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Client</td>
              <td style="padding: 8px 0; color: #111827; border-bottom: 1px solid #F3F4F6;">${clientName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Service</td>
              <td style="padding: 8px 0; color: #111827; border-bottom: 1px solid #F3F4F6;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280; border-bottom: 1px solid #F3F4F6;">Date</td>
              <td style="padding: 8px 0; color: #111827; border-bottom: 1px solid #F3F4F6;">${new Date(bookingDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6B7280;">Amount</td>
              <td style="padding: 8px 0; color: #2563EB; font-weight: 700; font-size: 18px;">$${(totalAmount / 100).toFixed(2)}</td>
            </tr>
          </table>
          <a href="${process.env.CLIENT_URL}/bookings/${bookingId}"
             style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px;
                    border-radius: 6px; text-decoration: none; font-weight: 600;">
            View Booking
          </a>
        </div>
        <div style="background: #F9FAFB; padding: 16px; text-align: center;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            MyHome Service Provider Marketplace &nbsp;|&nbsp; support@myhome.app
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendPaymentConfirmation,
  sendRefundNotification,
  sendProviderNotification,
};
