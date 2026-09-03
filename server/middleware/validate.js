/**
 * Boafo GH — Input Validation Middleware
 * Validates request bodies before they reach controllers.
 * Returns 422 with a list of field errors on failure.
 */

// ── Helper ────────────────────────────────────────────────────────────────
function err(field, message) {
  return { field, message };
}

function validate(rules) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, checks] of Object.entries(rules)) {
      const value = req.body[field];
      const str   = value !== undefined && value !== null ? String(value).trim() : '';

      // required
      if (checks.required && !str) {
        errors.push(err(field, `${field} is required`));
        continue; // skip further checks for this field if missing
      }

      // skip further checks if optional and empty
      if (!str && !checks.required) continue;

      // minLength
      if (checks.minLength && str.length < checks.minLength) {
        errors.push(err(field, `${field} must be at least ${checks.minLength} characters`));
      }

      // maxLength
      if (checks.maxLength && str.length > checks.maxLength) {
        errors.push(err(field, `${field} must be at most ${checks.maxLength} characters`));
      }

      // email format
      if (checks.email) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(str)) {
          errors.push(err(field, `${field} must be a valid email address`));
        }
      }

      // numeric
      if (checks.numeric && isNaN(Number(str))) {
        errors.push(err(field, `${field} must be a number`));
      }

      // min value
      if (checks.min !== undefined && Number(str) < checks.min) {
        errors.push(err(field, `${field} must be at least ${checks.min}`));
      }

      // max value
      if (checks.max !== undefined && Number(str) > checks.max) {
        errors.push(err(field, `${field} must be at most ${checks.max}`));
      }

      // enum (allowed values)
      if (checks.enum && !checks.enum.includes(str)) {
        errors.push(err(field, `${field} must be one of: ${checks.enum.join(', ')}`));
      }
    }

    if (errors.length > 0) {
      return res.status(422).json({ error: 'Validation failed', errors });
    }

    next();
  };
}

// ══════════════════════════════════════════════════════════════════════════
// VALIDATION RULE SETS
// ══════════════════════════════════════════════════════════════════════════

// ── Auth ──────────────────────────────────────────────────────────────────
const validateArtisanRegister = validate({
  name:     { required: true,  minLength: 2,  maxLength: 100 },
  email:    { required: true,  email: true },
  password: { required: true,  minLength: 6,  maxLength: 128 },
  phone:    { required: false, minLength: 7,  maxLength: 20 },
});

const validateCustomerRegister = validate({
  name:     { required: true,  minLength: 2,  maxLength: 100 },
  email:    { required: true,  email: true },
  password: { required: true,  minLength: 6,  maxLength: 128 },
  phone:    { required: false, minLength: 7,  maxLength: 20 },
});

const validateAdminRegister = validate({
  name:     { required: true,  minLength: 2,  maxLength: 100 },
  email:    { required: true,  email: true },
  password: { required: true,  minLength: 6,  maxLength: 128 },
});

const validateLogin = validate({
  email:    { required: true, email: true },
  password: { required: true, minLength: 1 },
});

// ── Artisan profile ───────────────────────────────────────────────────────
const validateProfileUpdate = validate({
  name:           { required: false, minLength: 2,  maxLength: 100 },
  phone:          { required: false, minLength: 7,  maxLength: 20 },
  bio:            { required: false, maxLength: 1000 },
  experience_yrs: { required: false, numeric: true, min: 0, max: 60 },
  location:       { required: false, maxLength: 150 },
  service_areas:  { required: false, maxLength: 300 },
  price_min:      { required: false, numeric: true, min: 0 },
  price_max:      { required: false, numeric: true, min: 0 },
  availability:   { required: false, maxLength: 100 },
  certifications: { required: false, maxLength: 500 },
});

// ── Jobs ──────────────────────────────────────────────────────────────────
const validateCreateJob = validate({
  title:       { required: true,  minLength: 5,  maxLength: 200 },
  description: { required: false, maxLength: 2000 },
  location:    { required: false, maxLength: 150 },
  budget_min:  { required: false, numeric: true, min: 0 },
  budget_max:  { required: false, numeric: true, min: 0 },
});

const validateJobStatus = validate({
  status: { required: true, enum: ['open', 'assigned', 'completed', 'cancelled'] },
});

const validateApply = validate({
  quote:   { required: false, numeric: true, min: 0 },
  message: { required: false, maxLength: 1000 },
});

const validateApplicationStatus = validate({
  status: { required: true, enum: ['accepted', 'rejected'] },
});

// ── Reviews ───────────────────────────────────────────────────────────────
const validateReview = validate({
  artisan_id: { required: true,  numeric: true, min: 1 },
  rating:     { required: true,  numeric: true, min: 1, max: 5 },
  comment:    { required: false, maxLength: 1000 },
});

// ── Messages ──────────────────────────────────────────────────────────────
const validateMessage = validate({
  content: { required: true, minLength: 1, maxLength: 2000 },
});

// ── Admin ─────────────────────────────────────────────────────────────────
const validateCategory = validate({
  name: { required: true, minLength: 2, maxLength: 100 },
  icon: { required: false, maxLength: 10 },
});

const validateVerify = validate({
  is_verified: { required: true },
});

// ── ML ────────────────────────────────────────────────────────────────────
const validateSentiment = validate({
  text: { required: true, minLength: 1, maxLength: 5000 },
});

module.exports = {
  validateArtisanRegister,
  validateCustomerRegister,
  validateAdminRegister,
  validateLogin,
  validateProfileUpdate,
  validateCreateJob,
  validateJobStatus,
  validateApply,
  validateApplicationStatus,
  validateReview,
  validateMessage,
  validateCategory,
  validateVerify,
  validateSentiment,
};
