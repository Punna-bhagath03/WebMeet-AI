import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 8000,
  mongoUri: process.env.MONGODB_URI || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '',
  jwtIssuer: process.env.JWT_ISSUER || 'webmeet-ai',
  jwtAudience: process.env.JWT_AUDIENCE || 'webmeet-ai-client',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

export const validateEnv = () => {
  const missingVars = [];

  if (!env.mongoUri) {
    missingVars.push('MONGODB_URI');
  }

  if (!env.jwtAccessSecret) {
    missingVars.push('JWT_ACCESS_SECRET');
  }

  if (!env.jwtRefreshSecret) {
    missingVars.push('JWT_REFRESH_SECRET');
  }

  if (!env.accessTokenExpiry) {
    missingVars.push('ACCESS_TOKEN_EXPIRY');
  }

  if (!env.refreshTokenExpiry) {
    missingVars.push('REFRESH_TOKEN_EXPIRY');
  }

  if (!env.jwtIssuer) {
    missingVars.push('JWT_ISSUER');
  }

  if (!env.jwtAudience) {
    missingVars.push('JWT_AUDIENCE');
  }

  if (!env.corsOrigin) {
    missingVars.push('CORS_ORIGIN');
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

export default env;