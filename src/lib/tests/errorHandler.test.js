/**
 * Tests for error handling functions
 * Requirements: 6.1, 6.2, 6.3, 6.4 through testing functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as errorHandler from '../utils/errorHandler.svelte.js';

// Mock goto function
const mockGoto = vi.fn();
vi.stubGlobal('goto', mockGoto);

describe('Error Handler Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Error Type Detection', () => {
		it('should detect validation errors (422)', () => {
			const error = { status: 422 };
			expect(errorHandler.getErrorType(error)).toBe(errorHandler.ERROR_TYPES.VALIDATION);
		});

		it('should detect authentication errors (401)', () => {
			const error = { status: 401 };
			expect(errorHandler.getErrorType(error)).toBe(errorHandler.ERROR_TYPES.AUTHENTICATION);
		});

		it('should detect authorization errors (403)', () => {
			const error = { status: 403 };
			expect(errorHandler.getErrorType(error)).toBe(errorHandler.ERROR_TYPES.AUTHORIZATION);
		});

		it('should detect server errors (500, 502, 503)', () => {
			expect(errorHandler.getErrorType({ status: 500 })).toBe(errorHandler.ERROR_TYPES.SERVER);
			expect(errorHandler.getErrorType({ status: 502 })).toBe(errorHandler.ERROR_TYPES.SERVER);
			expect(errorHandler.getErrorType({ status: 503 })).toBe(errorHandler.ERROR_TYPES.SERVER);
		});

		it('should detect network errors (no status)', () => {
			const error = { message: 'Network error' };
			expect(errorHandler.getErrorType(error)).toBe(errorHandler.ERROR_TYPES.NETWORK);
		});

		it('should default to unknown for unrecognized errors', () => {
			const error = { status: 418 }; // I'm a teapot
			expect(errorHandler.getErrorType(error)).toBe(errorHandler.ERROR_TYPES.UNKNOWN);
		});

		it('should handle null/undefined errors', () => {
			expect(errorHandler.getErrorType(null)).toBe(errorHandler.ERROR_TYPES.UNKNOWN);
			expect(errorHandler.getErrorType(undefined)).toBe(errorHandler.ERROR_TYPES.UNKNOWN);
		});
	});

	describe('Error Message Extraction', () => {
		it('should extract message from error.message', () => {
			const error = { message: 'Custom error message' };
			expect(errorHandler.getErrorMessage(error)).toBe('Custom error message');
		});

		it('should extract message from error.data.message', () => {
			const error = { data: { message: 'API error message' } };
			expect(errorHandler.getErrorMessage(error)).toBe('API error message');
		});

		it('should use fallback message when provided', () => {
			const error = { status: 500 };
			const fallback = 'Custom fallback';
			expect(errorHandler.getErrorMessage(error, fallback)).toBe(fallback);
		});

		it('should use default message based on error type', () => {
			const error = { status: 401 };
			const message = errorHandler.getErrorMessage(error);
			expect(message).toContain('Authentication failed');
		});

		it('should handle null/undefined errors with fallback', () => {
			const fallback = 'Fallback message';
			expect(errorHandler.getErrorMessage(null, fallback)).toBe(fallback);
		});
	});

	describe('Validation Error Handling', () => {
		it('should format validation errors correctly', () => {
			const validationErrors = {
				email: ['Email is required', 'Email format is invalid'],
				password: ['Password is too short']
			};

			const formatted = errorHandler.formatValidationErrors(validationErrors);

			expect(formatted).toEqual({
				email: ['Email is required', 'Email format is invalid'],
				password: ['Password is too short']
			});
		});

		it('should handle empty validation errors', () => {
			expect(errorHandler.formatValidationErrors({})).toEqual({});
			expect(errorHandler.formatValidationErrors(null)).toEqual({});
			expect(errorHandler.formatValidationErrors(undefined)).toEqual({});
		});

		it('should handle validation errors with empty arrays', () => {
			const validationErrors = {
				email: [],
				password: ['Password is required']
			};

			const formatted = errorHandler.formatValidationErrors(validationErrors);

			expect(formatted).toEqual({
				password: ['Password is required']
			});
		});

		it('should handle validation error from API response', () => {
			const error = {
				status: 422,
				data: {
					errors: {
						email: ['Email is required'],
						password: ['Password is too short']
					}
				}
			};

			const result = errorHandler.handleValidationError(error);

			expect(result).toEqual({
				email: ['Email is required'],
				password: ['Password is too short']
			});
		});
	});

	describe('Authentication Error Handling', () => {
		it('should handle authentication error with redirect', () => {
			const error = { status: 401, message: 'Token expired' };

			const result = errorHandler.handleAuthenticationError(error);

			expect(result).toEqual({
				auth: ['Token expired']
			});
			expect(setTimeout).toHaveBeenCalled();
		});

		it('should handle authentication error without redirect', () => {
			const error = { status: 401, message: 'Token expired' };

			const result = errorHandler.handleAuthenticationError(error, { redirect: false });

			expect(result).toEqual({
				auth: ['Token expired']
			});
			expect(setTimeout).not.toHaveBeenCalled();
		});

		it('should use custom redirect path', () => {
			const error = { status: 401 };
			const customPath = '/custom-login';

			errorHandler.handleAuthenticationError(error, { redirectPath: customPath });

			expect(setTimeout).toHaveBeenCalled();
			// Verify the setTimeout callback calls goto with custom path
			const callback = setTimeout.mock.calls[0][0];
			callback();
			expect(mockGoto).toHaveBeenCalledWith(customPath);
		});

		it('should use default message for authentication errors', () => {
			const error = { status: 401 };

			const result = errorHandler.handleAuthenticationError(error);

			expect(result.auth[0]).toContain('Authentication failed');
		});
	});

	describe('Authorization Error Handling', () => {
		it('should handle authorization error', () => {
			const error = { status: 403, message: 'Access denied' };

			const result = errorHandler.handleAuthorizationError(error);

			expect(result).toEqual({
				auth: ['Access denied']
			});
		});

		it('should use default message for authorization errors', () => {
			const error = { status: 403 };

			const result = errorHandler.handleAuthorizationError(error);

			expect(result.auth[0]).toContain('Access denied');
		});
	});

	describe('Network Error Handling', () => {
		it('should handle generic network error', () => {
			const error = { message: 'Network request failed' };

			const result = errorHandler.handleNetworkError(error);

			expect(result.network[0]).toContain('check your internet connection');
		});

		it('should handle fetch-specific errors', () => {
			const error = { message: 'fetch failed' };

			const result = errorHandler.handleNetworkError(error);

			expect(result.network[0]).toContain('Unable to connect to the server');
		});

		it('should handle timeout errors', () => {
			const error = { message: 'Request timeout occurred' };

			const result = errorHandler.handleNetworkError(error);

			expect(result.network[0]).toContain('Request timed out');
		});

		it('should handle custom network error messages', () => {
			const error = { message: 'Network error: Connection refused' };

			const result = errorHandler.handleNetworkError(error);

			expect(result.network[0]).toBe('Network error: Connection refused');
		});
	});

	describe('Server Error Handling', () => {
		it('should handle 500 internal server error', () => {
			const error = { status: 500 };

			const result = errorHandler.handleServerError(error);

			expect(result.server[0]).toContain('Internal server error');
		});

		it('should handle 502 bad gateway', () => {
			const error = { status: 502 };

			const result = errorHandler.handleServerError(error);

			expect(result.server[0]).toContain('temporarily unavailable');
		});

		it('should handle 503 service unavailable', () => {
			const error = { status: 503 };

			const result = errorHandler.handleServerError(error);

			expect(result.server[0]).toContain('Service is temporarily unavailable');
		});

		it('should handle custom server error message', () => {
			const error = { status: 500, message: 'Database connection failed' };

			const result = errorHandler.handleServerError(error);

			expect(result.server[0]).toBe('Database connection failed');
		});
	});

	describe('Main API Error Handler', () => {
		it('should route validation errors correctly', () => {
			const error = {
				status: 422,
				data: { errors: { email: ['Required'] } }
			};

			const result = errorHandler.handleApiError(error);

			expect(result).toEqual({ email: ['Required'] });
		});

		it('should route authentication errors correctly', () => {
			const error = { status: 401, message: 'Unauthorized' };

			const result = errorHandler.handleApiError(error);

			expect(result).toEqual({ auth: ['Unauthorized'] });
		});

		it('should route authorization errors correctly', () => {
			const error = { status: 403, message: 'Forbidden' };

			const result = errorHandler.handleApiError(error);

			expect(result).toEqual({ auth: ['Forbidden'] });
		});

		it('should route network errors correctly', () => {
			const error = { message: 'Network failed' };

			const result = errorHandler.handleApiError(error);

			expect(result.network).toBeDefined();
		});

		it('should route server errors correctly', () => {
			const error = { status: 500 };

			const result = errorHandler.handleApiError(error);

			expect(result.server).toBeDefined();
		});

		it('should handle unknown errors', () => {
			const error = { status: 418, message: 'I am a teapot' };

			const result = errorHandler.handleApiError(error);

			expect(result).toEqual({ general: ['I am a teapot'] });
		});

		it('should handle null errors', () => {
			const result = errorHandler.handleApiError(null);

			expect(result.general).toBeDefined();
			expect(result.general[0]).toContain('unexpected error');
		});

		it('should respect redirectOnAuth option', () => {
			const error = { status: 401 };

			errorHandler.handleApiError(error, { redirectOnAuth: false });

			expect(setTimeout).not.toHaveBeenCalled();
		});
	});

	describe('Utility Functions', () => {
		describe('createDisplayMessages', () => {
			it('should create display messages from errors object', () => {
				const errors = {
					email: ['Required', 'Invalid format'],
					password: ['Too short']
				};

				const result = errorHandler.createDisplayMessages(errors);

				expect(result).toEqual({
					email: 'Required Invalid format',
					password: 'Too short'
				});
			});

			it('should handle custom separator', () => {
				const errors = {
					email: ['Required', 'Invalid format']
				};

				const result = errorHandler.createDisplayMessages(errors, ' | ');

				expect(result).toEqual({
					email: 'Required | Invalid format'
				});
			});

			it('should handle string messages', () => {
				const errors = {
					email: 'Single error message'
				};

				const result = errorHandler.createDisplayMessages(errors);

				expect(result).toEqual({
					email: 'Single error message'
				});
			});
		});

		describe('getFirstErrorMessage', () => {
			it('should get first error message from array', () => {
				const errors = {
					email: ['First error', 'Second error'],
					password: ['Password error']
				};

				const result = errorHandler.getFirstErrorMessage(errors);

				expect(result).toBe('First error');
			});

			it('should handle string messages', () => {
				const errors = {
					email: 'String error'
				};

				const result = errorHandler.getFirstErrorMessage(errors);

				expect(result).toBe('String error');
			});

			it('should return null for empty errors', () => {
				expect(errorHandler.getFirstErrorMessage({})).toBeNull();
				expect(errorHandler.getFirstErrorMessage(null)).toBeNull();
			});
		});

		describe('hasErrors', () => {
			it('should return true when errors exist', () => {
				const errors = { email: ['Error'] };
				expect(errorHandler.hasErrors(errors)).toBe(true);
			});

			it('should return false when no errors', () => {
				expect(errorHandler.hasErrors({})).toBe(false);
				expect(errorHandler.hasErrors(null)).toBe(false);
			});
		});

		describe('clearErrorFields', () => {
			it('should clear single field', () => {
				const errors = {
					email: ['Error'],
					password: ['Error']
				};

				const result = errorHandler.clearErrorFields(errors, 'email');

				expect(result).toEqual({
					password: ['Error']
				});
			});

			it('should clear multiple fields', () => {
				const errors = {
					email: ['Error'],
					password: ['Error'],
					name: ['Error']
				};

				const result = errorHandler.clearErrorFields(errors, ['email', 'password']);

				expect(result).toEqual({
					name: ['Error']
				});
			});

			it('should handle empty errors object', () => {
				const result = errorHandler.clearErrorFields({}, 'email');
				expect(result).toEqual({});
			});
		});

		describe('mergeErrors', () => {
			it('should merge multiple error objects', () => {
				const errors1 = { email: ['Error 1'] };
				const errors2 = { password: ['Error 2'] };
				const errors3 = { name: ['Error 3'] };

				const result = errorHandler.mergeErrors(errors1, errors2, errors3);

				expect(result).toEqual({
					email: ['Error 1'],
					password: ['Error 2'],
					name: ['Error 3']
				});
			});

			it('should handle overlapping fields (later wins)', () => {
				const errors1 = { email: ['Error 1'] };
				const errors2 = { email: ['Error 2'] };

				const result = errorHandler.mergeErrors(errors1, errors2);

				expect(result).toEqual({
					email: ['Error 2']
				});
			});

			it('should handle null/undefined inputs', () => {
				const errors1 = { email: ['Error'] };

				const result = errorHandler.mergeErrors(errors1, null, undefined);

				expect(result).toEqual({
					email: ['Error']
				});
			});
		});
	});
});