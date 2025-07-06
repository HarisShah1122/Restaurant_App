const { body, query } = require('express-validator');

const validationUser = [
  body('firstname')
    .notEmpty()
    .withMessage('First name is required')
    .trim(),
  body('lastname')
    .notEmpty()
    .withMessage('Last name is required')
    .trim(),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['customer', 'admin', 'staff'])
    .withMessage('Role must be one of: customer, admin, staff')
    .trim(),
];

const validationLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const validationRestaurant = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim(),
  body('cuisine')
    .notEmpty()
    .withMessage('Cuisine is required')
    .trim(),
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .trim(),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
];

const validateSearchQuery = [
  query('query')
    .optional()
    .isString()
    .withMessage('Query must be a string')
    .isLength({ max: 100 })
    .withMessage('Query must be less than 100 characters')
    .trim(),
];

const validateFilters = [
  query('cuisine')
    .optional()
    .isString()
    .withMessage('Cuisine must be a string'),
  query('location')
    .optional()
    .isString()
    .withMessage('Location must be a string'),
  query('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
];

module.exports = {
  validationUser,
  validationLogin,
  validationRestaurant,
  validateSearchQuery,
  validateFilters,
};