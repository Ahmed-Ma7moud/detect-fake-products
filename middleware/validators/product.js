const { body, param, query } = require("express-validator");

// Constants
const MAX_PRICE = 1_000_000;
const MAX_QUANTITY = 1_000;
const MAX_LIMIT = 20;

const UUID_REGEX = /^[a-f\d]{8}-([a-f\d]{4}-){3}[a-f\d]{12}$/i;
const BATCH_REGEX = /^BA\d{4}$/;
const DEFAULT_TEXT_REGEX = /^[\w\s-]{2,50}$/;

// Generic text validator
function validateText(field, regex = DEFAULT_TEXT_REGEX, source = 'body') {
  const sources = { body, param, query };
  const validator = sources[source](field);

  return validator
    .trim()
    .notEmpty().withMessage(`${field} is required`)
    .isString().withMessage(`${field} must be a string`)
    .matches(regex).withMessage(`${field} has invalid characters or format`)
    .escape();
}

// Batch addition validation
exports.addBatchValidation = [
  validateText("name"),
  
  body("price")
    .isFloat({ gt: 0, lt: MAX_PRICE + 1 })
    .withMessage(`Price must be a number between 0 and ${MAX_PRICE}`)
    .toFloat(),

  body("quantity")
    .isInt({ gt: 0, lt: MAX_QUANTITY + 1 })
    .withMessage(`Quantity must be an integer between 1 and ${MAX_QUANTITY}`)
    .toInt()
];

// ID validation (e.g. UUID / serial number)
exports.idValidation = [
  validateText("id", UUID_REGEX, 'param')
    .withMessage("Invalid ID format (must be a UUID)")
];

// Batch param validation
exports.batchValidation = [
  validateText("batch", BATCH_REGEX, 'param')
    .withMessage("Invalid batch number (expected format: BA0000)")
];

// Location + pagination query validation
exports.locationValidation = [
  query("location")
    .trim()
    .notEmpty().withMessage("Location cannot be empty")
    .isString().withMessage("Location must be a string")
    .escape(),

  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage(`Limit must be an integer greater than 0`)
    .toInt()
    .custom((value, { req }) => {
      if (value > MAX_LIMIT) {
        req.query.limit = MAX_LIMIT;
      }
      return true;
    })
];
