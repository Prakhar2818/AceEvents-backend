const express = require('express');
const {
  validateSignup,
  validateLogin,
  handleValidationErrors
} = require('../middleware/validation');
const auth = require('../middleware/auth');
const {
  signup,
  login,
  getMe
} = require('../controller/authController');

const router = express.Router();

// @route   POST /api/auth/signup
router.post('/signup', validateSignup, handleValidationErrors, signup);

// @route   POST /api/auth/login
router.post('/login', validateLogin, handleValidationErrors, login);

// @route   GET /api/auth/me
router.get('/me', auth, getMe);

module.exports = router;
