// src/constants/config.ts

export const APP_CONFIG = {
  NAME: 'FarmCare',
  VERSION: '1.0.0',
  BUILD: 1,
};

export const AUTH_CONFIG = {
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: false,
  SESSION_TIMEOUT_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const DELIVERY_CONFIG = {
  FREE_THRESHOLD: 1000, // KES
  STANDARD_FEE: 150, // KES
  EXPRESS_FEE: 300, // KES
};

export const ORDER_CONFIG = {
  MIN_ORDER_AMOUNT: 100, // KES
  MAX_ORDER_AMOUNT: 100000, // KES
  CANCEL_WINDOW_MINUTES: 30,
};

export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_KE: /^(\+254|0)?[17]\d{8}$/, // Kenyan phone format
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
};

export const API_CONFIG = {
  TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};

export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 5,
  QUALITY: 0.7,
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1920,
};

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const CACHE_CONFIG = {
  CART_KEY: '@farmcare:cart',
  USER_KEY: '@farmcare:user',
  TOKEN_KEY: '@farmcare:token',
  EXPIRY_MS: 24 * 60 * 60 * 1000, // 24 hours
};

export const NOTIFICATION_CONFIG = {
  ORDER_UPDATES: true,
  PROMOTIONS: false,
  REMINDERS: true,
};
