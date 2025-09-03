const { body, validationResult } = require('express-validator');

const validateSignup = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateEvent = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Event description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('dateOptions')
    .isArray({ min: 1 })
    .withMessage('At least one date option is required'),
  
  body('dateOptions.*.date')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('dateOptions.*.time')
    .notEmpty()
    .withMessage('Time is required for each date option'),
  
  body('poll.question')
    .trim()
    .notEmpty()
    .withMessage('Poll question is required')
    .isLength({ max: 200 })
    .withMessage('Poll question cannot exceed 200 characters'),
  
  body('poll.options')
    .isArray({ min: 2 })
    .withMessage('At least two poll options are required'),
  
  body('poll.options.*')
    .trim()
    .notEmpty()
    .withMessage('Poll option cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Poll option cannot exceed 100 characters')
];


// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateSignup,
  validateLogin,
  validateEvent,
  handleValidationErrors
};
