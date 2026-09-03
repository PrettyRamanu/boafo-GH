/**
 * Global error handler — catches anything thrown with next(err)
 * Prevents stack traces leaking to the client in production.
 */
module.exports = function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message || err);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  // PostgreSQL check constraint violation (e.g. rating 1-5)
  if (err.code === '23514') {
    return res.status(422).json({ error: 'Value failed a database constraint check' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  // Fallback
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong. Please try again.'
    : err.message || 'Internal server error';

  res.status(status).json({ error: message });
};
