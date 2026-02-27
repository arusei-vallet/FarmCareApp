// src/constants/index.ts

export const COLORS = {
  // Primary brand colors
  PRIMARY: '#1B5E20',
  PRIMARY_LIGHT: '#4CAF50',
  PRIMARY_DARK: '#003300',
  
  // Accent colors
  ACCENT: '#2ECC71',
  ACCENT_LIGHT: '#58D68D',
  
  // Status colors
  SUCCESS: '#2E7D32',
  WARNING: '#FF9800',
  ERROR: '#D32F2F',
  INFO: '#1976D2',
  
  // Neutral colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_LIGHT: '#F5F5F5',
  GRAY: '#9E9E9E',
  GRAY_DARK: '#424242',
  
  // Background colors
  BG_LIGHT: '#E6F5E6',
  BG_MEDIUM: '#C8E6C9',
  BG_DARK: '#A5D6A7',
  
  // Role-specific colors
  CUSTOMER: '#2ECC71',
  FARMER: '#1B5E20',
  AGRODEALER: '#2196F3',
};

export const FONTS = {
  REGULAR: 'System',
  BOLD: 'System',
  SEMIBOLD: 'System',
};

export const FONT_SIZES = {
  XS: 10,
  SM: 12,
  MD: 14,
  LG: 16,
  XL: 18,
  XXL: 20,
  XXXL: 24,
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  XXXL: 32,
};

export const BORDER_RADIUS = {
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  CIRCLE: 9999,
};

export const SHADOWS = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
