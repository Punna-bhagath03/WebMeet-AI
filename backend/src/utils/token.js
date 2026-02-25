import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const generateAccessToken = (payload) => {
  return jwt.sign({ ...payload, type: 'access' }, env.jwtAccessSecret, {
    expiresIn: env.accessTokenExpiry,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign({ ...payload, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: env.refreshTokenExpiry,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtAccessSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwtRefreshSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};