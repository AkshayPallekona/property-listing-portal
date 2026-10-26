// Custom NoSQL sanitizer: strip keys starting with $ or containing .
const sanitize = (req, res, next) => {
  const sanitizeObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const clean = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) continue;
      clean[key] = sanitizeObj(obj[key]);
    }
    return clean;
  };
  if (req.body) req.body = sanitizeObj(req.body);
  if (req.query) req.query = sanitizeObj(req.query);
  if (req.params) req.params = sanitizeObj(req.params);
  next();
};

module.exports = sanitize;
