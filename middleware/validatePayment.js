const { body, validationResult } = require('express-validator');

/**
 * Validate POST /create-intent
 */
const validateCreatePaymentIntent = [
  body('amount')
    .isInt({ min: 50 })
    .withMessage('Amount must be a positive integer (in cents, minimum 50)'),
  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isMongoId()
    .withMessage('Invalid booking ID'),
];

/**
 * Validate POST /process
 */
const validateProcessPayment = [
  body('paymentIntentId')
    .notEmpty()
    .withMessage('Payment intent ID is required')
    .isString()
    .withMessage('Payment intent ID must be a string'),
  body('paymentMethodId')
    .notEmpty()
    .withMessage('Payment method ID is required')
    .isString()
    .withMessage('Payment method ID must be a string'),
  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isMongoId()
    .withMessage('Invalid booking ID'),
];

/**
 * Validate POST /refund
 */
const validateRefund = [
  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isMongoId()
    .withMessage('Invalid booking ID'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('amount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Refund amount must be a positive integer (in cents)'),
];

/**
 * Middleware to collect validation errors and return 400 if any exist.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateCreatePaymentIntent: [...validateCreatePaymentIntent, handleValidationErrors],
  validateProcessPayment: [...validateProcessPayment, handleValidationErrors],
  validateRefund: [...validateRefund, handleValidationErrors],
  handleValidationErrors,
};
