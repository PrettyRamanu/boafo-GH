const jwt = require('jsonwebtoken');
function auth(roles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    try {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role)) return res.status(403).json({ error: 'Forbidden' });
      req.user = decoded; next();
    } catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
  };
}
module.exports = auth;
