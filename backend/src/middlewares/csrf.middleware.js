import env from '../config/env.js';

const requireTrustedOrigin = (req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    return next();
  }

  if (origin !== env.corsOrigin) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  return next();
};

export { requireTrustedOrigin };