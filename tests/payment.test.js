const invoiceService = require('../services/invoiceService');
const stripeService = require('../services/stripeService');

// ─── Invoice Service Tests ─────────────────────────────────────────────────
describe('invoiceService.generateInvoiceNumber', () => {
  it('generates a string starting with INV-', () => {
    const num = invoiceService.generateInvoiceNumber();
    expect(typeof num).toBe('string');
    expect(num.startsWith('INV-')).toBe(true);
  });

  it('generates unique invoice numbers', () => {
    const nums = new Set(Array.from({ length: 100 }, () => invoiceService.generateInvoiceNumber()));
    expect(nums.size).toBe(100);
  });
});

describe('invoiceService.generatePDFInvoice', () => {
  const mockInvoice = {
    invoiceNumber: 'INV-TEST-001',
    client: { name: 'Test Client', email: 'client@test.com', address: '123 Main St' },
    serviceProvider: { name: 'Test Provider', email: 'provider@test.com', address: '456 Oak Ave' },
    items: [
      { description: 'Cleaning Service', quantity: 1, unitPrice: 5000, total: 5000 }
    ],
    subtotal: 5000,
    taxRate: 8.5,
    tax: 425,
    total: 5425,
    status: 'paid',
    paidDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-15'),
    dueDate: new Date('2024-01-15'),
    notes: 'Thank you for your business!'
  };

  it('returns a Buffer', async () => {
    const buf = await invoiceService.generatePDFInvoice(mockInvoice);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('returns non-empty PDF buffer', async () => {
    const buf = await invoiceService.generatePDFInvoice(mockInvoice);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('PDF starts with %PDF header', async () => {
    const buf = await invoiceService.generatePDFInvoice(mockInvoice);
    expect(buf.toString('utf8', 0, 4)).toBe('%PDF');
  });

  it('handles invoice with no items gracefully', async () => {
    const invoiceNoItems = { ...mockInvoice, items: [] };
    const buf = await invoiceService.generatePDFInvoice(invoiceNoItems);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
  });

  it('handles missing optional fields gracefully', async () => {
    const minimalInvoice = {
      invoiceNumber: 'INV-MIN-001',
      subtotal: 1000,
      tax: 0,
      total: 1000,
      status: 'paid'
    };
    const buf = await invoiceService.generatePDFInvoice(minimalInvoice);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });
});

// ─── Stripe Service Unit Tests ─────────────────────────────────────────────
describe('stripeService.constructWebhookEvent', () => {
  it('throws an error when signature is invalid', () => {
    const payload = Buffer.from(JSON.stringify({ type: 'test' }));
    expect(() =>
      stripeService.constructWebhookEvent(payload, 'bad-signature', 'whsec_test')
    ).toThrow();
  });
});

// ─── validatePayment middleware ────────────────────────────────────────────
describe('validatePayment middleware', () => {
  const { validateCreatePaymentIntent, validateProcessPayment, validateRefund } =
    require('../middleware/validatePayment');

  it('exports validateCreatePaymentIntent as array', () => {
    expect(Array.isArray(validateCreatePaymentIntent)).toBe(true);
    expect(validateCreatePaymentIntent.length).toBeGreaterThan(0);
  });

  it('exports validateProcessPayment as array', () => {
    expect(Array.isArray(validateProcessPayment)).toBe(true);
    expect(validateProcessPayment.length).toBeGreaterThan(0);
  });

  it('exports validateRefund as array', () => {
    expect(Array.isArray(validateRefund)).toBe(true);
    expect(validateRefund.length).toBeGreaterThan(0);
  });
});

// ─── Config Tests ──────────────────────────────────────────────────────────
describe('stripe config', () => {
  it('exports stripe instance and config object', () => {
    const { stripe, stripeConfig } = require('../config/stripe');
    expect(stripe).toBeDefined();
    expect(stripeConfig).toHaveProperty('currency');
    expect(stripeConfig.currency).toBe('usd');
  });
});
