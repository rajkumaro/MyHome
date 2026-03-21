import axios from 'axios';

const api = axios.create({ baseURL: '/api/payments' });

// Attach auth token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Create a Stripe PaymentIntent for the given booking.
 * @param {string} bookingId
 */
export const createPaymentIntent = (bookingId) =>
  api.post('/create-intent', { bookingId });

/**
 * Record a confirmed payment on the server.
 * @param {{ paymentIntentId: string, paymentMethodId: string, bookingId: string }} data
 */
export const processPayment = (data) =>
  api.post('/process', {
    paymentIntentId: data.paymentIntentId,
    paymentMethodId: data.paymentMethodId,
    bookingId: data.bookingId,
  });

/**
 * Retrieve paginated payment history.
 * @param {{ page?: number, limit?: number, status?: string, dateFrom?: string, dateTo?: string }} params
 */
export const getPaymentHistory = (params = {}) =>
  api.get('/history', { params });

/**
 * Fetch the invoice PDF for a booking as an ArrayBuffer blob.
 * @param {string} bookingId
 */
export const getInvoice = (bookingId) =>
  api.get(`/invoice/${bookingId}`, { responseType: 'arraybuffer' });

/**
 * Download the invoice PDF for a booking, triggering a browser save dialog.
 * @param {string} bookingId
 */
export const downloadInvoice = async (bookingId) => {
  const response = await getInvoice(bookingId);
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${bookingId}.pdf`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Submit a refund request.
 * @param {{ bookingId: string, reason: string, amount?: number }} data
 */
export const refundPayment = (data) =>
  api.post('/refund', {
    bookingId: data.bookingId,
    reason: data.reason,
    amount: data.amount,
  });

/**
 * List all saved payment methods for the authenticated user.
 */
export const getPaymentMethods = () => api.get('/methods');

/**
 * Save a new payment method (Stripe paymentMethodId).
 * @param {string} paymentMethodId
 */
export const addPaymentMethod = (paymentMethodId) =>
  api.post('/methods', { paymentMethodId });

/**
 * Remove a saved payment method.
 * @param {string} paymentMethodId
 */
export const deletePaymentMethod = (paymentMethodId) =>
  api.delete(`/methods/${paymentMethodId}`);

/**
 * Set a saved payment method as the default.
 * @param {string} paymentMethodId
 */
export const setDefaultPaymentMethod = (paymentMethodId) =>
  api.put(`/methods/${paymentMethodId}/default`);

export default {
  createPaymentIntent,
  processPayment,
  getPaymentHistory,
  getInvoice,
  downloadInvoice,
  refundPayment,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
};
