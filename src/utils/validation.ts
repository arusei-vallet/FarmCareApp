// src/utils/validation.ts
import { VALIDATION_PATTERNS, AUTH_CONFIG } from '../constants/config';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  const trimmed = email.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Email is required' };
  }
  
  if (!VALIDATION_PATTERNS.EMAIL.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  return { valid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
    return { 
      valid: false, 
      error: `Password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters` 
    };
  }
  
  if (AUTH_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (AUTH_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (AUTH_CONFIG.REQUIRE_NUMBER && !/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  return { valid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  const trimmed = phone.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  // Remove spaces and dashes for validation
  const cleaned = trimmed.replace(/[\s\-]/g, '');
  
  if (!VALIDATION_PATTERNS.PHONE_KE.test(cleaned)) {
    return { 
      valid: false, 
      error: 'Please enter a valid Kenyan phone number (e.g., 0712345678)' 
    };
  }
  
  return { valid: true };
};

export const validateName = (name: string, fieldName = 'Name'): ValidationResult => {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: `${fieldName} must be less than 100 characters` };
  }
  
  return { valid: true };
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (!confirmPassword) {
    return { valid: false, error: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  
  return { valid: true };
};

export const validateRegistration = (data: {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const nameValidation = validateName(data.name, 'Full Name');
  if (!nameValidation.valid) errors.name = nameValidation.error!;
  
  const phoneValidation = validatePhone(data.phone);
  if (!phoneValidation.valid) errors.phone = phoneValidation.error!;
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) errors.email = emailValidation.error!;
  
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) errors.password = passwordValidation.error!;
  
  const confirmValidation = validateConfirmPassword(data.password, data.confirmPassword);
  if (!confirmValidation.valid) errors.confirmPassword = confirmValidation.error!;
  
  return errors;
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 1000); // Limit length
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('254')) {
    return `+${cleaned}`;
  }
  
  if (cleaned.startsWith('0')) {
    return `+254${cleaned.substring(1)}`;
  }
  
  return `+254${cleaned}`;
};

export const formatCurrency = (amount: number, currency = 'KES'): string => {
  return `${currency} ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
