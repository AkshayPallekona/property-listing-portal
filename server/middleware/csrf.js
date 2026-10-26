// CSRF protection: custom header + Origin/Referer check
const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const header = req.get('X-Requested-With');
  if (header !== 'XMLHttpRequest') {
    return res.status(403).json({ success: false, error: { code: 'CSRF', message: 'Invalid request origin' } });
  }
  const origin = req.get('Origin') || req.get('Referer');
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
  if (origin && !allowed.some(a => origin.startsWith(a))) {
    return res.status(403).json({ success: false, error: { code: 'CSRF', message: 'Origin not allowed' } });
  }
  next();
};

module.exports = csrfProtection;
