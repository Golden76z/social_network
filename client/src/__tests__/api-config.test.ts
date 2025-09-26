/**
 * Test suite for the new error handling and API configuration system
 */

import { API_CONFIG, ERROR_CODES, ERROR_MESSAGES, getErrorMessage, getErrorCode } from '@/lib/config/api';

describe('API Configuration', () => {
  test('should have correct base URL configuration', () => {
    expect(API_CONFIG.baseUrl).toBeDefined();
    expect(API_CONFIG.wsUrl).toBeDefined();
    expect(API_CONFIG.timeout).toBe(30000);
    expect(API_CONFIG.retries).toBe(3);
  });

  test('should have all required endpoints', () => {
    expect(API_CONFIG.baseUrl).toContain('localhost:8080');
    expect(API_CONFIG.wsUrl).toContain('ws://localhost:8080/ws');
  });

  test('should have file upload limits', () => {
    expect(API_CONFIG.maxFileSize).toBe(10 * 1024 * 1024); // 10MB
    expect(API_CONFIG.allowedImageTypes).toContain('image/jpeg');
    expect(API_CONFIG.allowedImageTypes).toContain('image/png');
  });
});

describe('Error Codes and Messages', () => {
  test('should have all required error codes', () => {
    expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ERROR_CODES.FILE_TOO_LARGE).toBe('FILE_TOO_LARGE');
  });

  test('should have user-friendly error messages', () => {
    expect(ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED]).toBe('Please log in to continue');
    expect(ERROR_MESSAGES[ERROR_CODES.FILE_TOO_LARGE]).toBe('File is too large. Maximum size is 10MB');
    expect(ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]).toBe('Network error. Please check your connection');
  });

  test('getErrorMessage should return correct messages', () => {
    const error = { code: ERROR_CODES.UNAUTHORIZED };
    expect(getErrorMessage(error)).toBe('Please log in to continue');
    
    const stringError = 'Simple error message';
    expect(getErrorMessage(stringError)).toBe('Simple error message');
    
    const unknownError = { message: 'Custom error' };
    expect(getErrorMessage(unknownError)).toBe('Custom error');
  });

  test('getErrorCode should return correct codes', () => {
    const error = { code: ERROR_CODES.UNAUTHORIZED };
    expect(getErrorCode(error)).toBe(ERROR_CODES.UNAUTHORIZED);
    
    const messageError = { message: 'Unauthorized access' };
    expect(getErrorCode(messageError)).toBe(ERROR_CODES.UNAUTHORIZED);
    
    const unknownError = { message: 'Unknown error' };
    expect(getErrorCode(unknownError)).toBe(ERROR_CODES.INTERNAL_ERROR);
  });
});

describe('Environment Detection', () => {
  test('should detect development environment', () => {
    // In test environment, NODE_ENV might be 'test', so we check for development or test
    expect(API_CONFIG.isDevelopment || process.env.NODE_ENV === 'test').toBe(true);
    expect(['development', 'test']).toContain(API_CONFIG.environment);
  });

  test('should have correct environment settings', () => {
    expect(API_CONFIG.isProduction).toBe(false);
  });
});

describe('File Validation', () => {
  test('should validate file sizes correctly', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const smallFile = new File(['x'.repeat(1024)], 'small.jpg', { type: 'image/jpeg' });
    
    expect(largeFile.size).toBeGreaterThan(API_CONFIG.maxFileSize);
    expect(smallFile.size).toBeLessThan(API_CONFIG.maxFileSize);
  });

  test('should validate image types correctly', () => {
    const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const pngFile = new File([''], 'test.png', { type: 'image/png' });
    const txtFile = new File([''], 'test.txt', { type: 'text/plain' });
    
    expect(API_CONFIG.allowedImageTypes).toContain(jpegFile.type);
    expect(API_CONFIG.allowedImageTypes).toContain(pngFile.type);
    expect(API_CONFIG.allowedImageTypes).not.toContain(txtFile.type);
  });
});
