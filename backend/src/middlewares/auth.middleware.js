import { verifyAccessToken } from '../utils/token.js';

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      console.warn('REST auth failed: missing/invalid bearer header', {
        path: req.originalUrl,
      });
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const decoded = verifyAccessToken(token);

    if (!decoded || decoded.type !== 'access') {
      console.warn('REST auth failed: token type invalid', {
        path: req.originalUrl,
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      console.warn('REST auth failed: access token expired', {
        path: req.originalUrl,
      });
      return res.status(401).json({ error: 'Access token expired' });
    }

    if (error?.name === 'JsonWebTokenError') {
      console.warn('REST auth failed: invalid access token', {
        path: req.originalUrl,
      });
      return res.status(401).json({ error: 'Invalid access token' });
    }

    console.warn('REST auth failed: unauthorized', {
      path: req.originalUrl,
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

const verifyToken = protect;

export { protect, verifyToken };