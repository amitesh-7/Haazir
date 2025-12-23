/**
 * Environment Configuration
 * Centralizes all environment variables with validation and defaults
 */

import logger from '../utils/logger';

interface EnvConfig {
  // Server
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  
  // Database
  DATABASE_URL: string;
  DB_SSL: boolean;
  DB_SSL_REJECT_UNAUTHORIZED: boolean;
  DB_POOL_MAX: number;
  DB_POOL_MIN: number;
  
  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET: string;
  
  // CORS
  CORS_ORIGIN: string;
  FRONTEND_URL: string;
  
  // Smart Attendance
  QR_EXPIRY_SECONDS: number;
  LOCATION_RADIUS_METERS: number;
  FACE_MATCH_THRESHOLD: number;
  DISABLE_LOCATION_CHECK: boolean;
  SCAN_TIMEOUT_SECONDS: number;
  
  // Rate Limiting
  AUTH_RATE_LIMIT_WINDOW_MS: number;
  AUTH_RATE_LIMIT_MAX: number;
  API_RATE_LIMIT_WINDOW_MS: number;
  API_RATE_LIMIT_MAX: number;
  
  // Logging
  LOG_LEVEL: string;
}

const getEnvString = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value !== undefined) return value;
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Missing required environment variable: ${key}`);
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (value !== undefined) {
    const parsed = Number(value);
    if (!isNaN(parsed)) return parsed;
  }
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Missing or invalid environment variable: ${key}`);
};

const getEnvBoolean = (key: string, defaultValue?: boolean): boolean => {
  const value = process.env[key];
  if (value !== undefined) {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Missing environment variable: ${key}`);
};

const validateJwtSecret = (secret: string): void => {
  if (process.env.NODE_ENV === 'production') {
    if (secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    if (secret.includes('change-in-production') || secret.includes('fallback')) {
      throw new Error('JWT_SECRET contains insecure default value');
    }
  }
};

export const loadEnvConfig = (): EnvConfig => {
  const nodeEnv = (process.env.NODE_ENV || 'development') as EnvConfig['NODE_ENV'];
  const isProduction = nodeEnv === 'production';
  
  // JWT Secret validation
  const jwtSecret = getEnvString('JWT_SECRET', isProduction ? undefined : 'dev-secret-key-min-32-characters-long');
  validateJwtSecret(jwtSecret);
  
  const config: EnvConfig = {
    // Server
    NODE_ENV: nodeEnv,
    PORT: getEnvNumber('PORT', 5000),
    
    // Database
    DATABASE_URL: getEnvString('DATABASE_URL', ''),
    DB_SSL: getEnvBoolean('DB_SSL', true),
    DB_SSL_REJECT_UNAUTHORIZED: getEnvBoolean('DB_SSL_REJECT_UNAUTHORIZED', false),
    DB_POOL_MAX: getEnvNumber('DB_POOL_MAX', isProduction ? 20 : 5),
    DB_POOL_MIN: getEnvNumber('DB_POOL_MIN', isProduction ? 5 : 1),
    
    // Authentication
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: getEnvString('JWT_EXPIRES_IN', '24h'),
    REFRESH_TOKEN_SECRET: getEnvString('REFRESH_TOKEN_SECRET', isProduction ? undefined : 'dev-refresh-secret-32-chars-long'),
    
    // CORS
    CORS_ORIGIN: getEnvString('CORS_ORIGIN', 'http://localhost:3000'),
    FRONTEND_URL: getEnvString('FRONTEND_URL', 'http://localhost:3000'),
    
    // Smart Attendance - Production vs Development defaults
    QR_EXPIRY_SECONDS: getEnvNumber('QR_EXPIRY_SECONDS', 300),
    LOCATION_RADIUS_METERS: getEnvNumber('LOCATION_RADIUS_METERS', isProduction ? 100 : 100000),
    FACE_MATCH_THRESHOLD: getEnvNumber('FACE_MATCH_THRESHOLD', 0.6),
    DISABLE_LOCATION_CHECK: getEnvBoolean('DISABLE_LOCATION_CHECK', !isProduction),
    SCAN_TIMEOUT_SECONDS: getEnvNumber('SCAN_TIMEOUT_SECONDS', 60),
    
    // Rate Limiting
    AUTH_RATE_LIMIT_WINDOW_MS: getEnvNumber('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    AUTH_RATE_LIMIT_MAX: getEnvNumber('AUTH_RATE_LIMIT_MAX', 5),
    API_RATE_LIMIT_WINDOW_MS: getEnvNumber('API_RATE_LIMIT_WINDOW_MS', 60 * 1000),
    API_RATE_LIMIT_MAX: getEnvNumber('API_RATE_LIMIT_MAX', 100),
    
    // Logging
    LOG_LEVEL: getEnvString('LOG_LEVEL', isProduction ? 'info' : 'debug'),
  };
  
  logger.info('Environment configuration loaded', { 
    env: config.NODE_ENV,
    port: config.PORT,
  });
  
  return config;
};

// Singleton instance
let envConfig: EnvConfig | null = null;

export const getEnvConfig = (): EnvConfig => {
  if (!envConfig) {
    envConfig = loadEnvConfig();
  }
  return envConfig;
};

export default getEnvConfig;
