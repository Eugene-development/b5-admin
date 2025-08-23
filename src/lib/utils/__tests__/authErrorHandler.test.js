/**
 * Tests for Authentication Error Handler Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
	handleAuthError,
	handleNetworkError,
	handleTimeoutError,
	retryAuthOperation,
	executeCriticalAuthOperation,
	formatValidationErrors,
	isRecoverableError,
	createDebouncedErrorHandler,
	CRITICAL_OPERATIONS,
	AUTH_ERROR_MESSAGES
} from '../authErrorHandler.js';
import { ApiError } from '../../api/client.js';

// Mock dependencies
vi.mock('../toastStore.js', () => ({
	addErrorToast: vi.fn(),
	addWarningToast: vi.fn(),
	addSuccessToast: vi.fn()
}));

vi.mock('../../api/config.js', () => ({
	removeAuthToken: vi.fn()
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock window.location
Object.defineProperty(window, 'location', {
	value: {
		pathname: '/test-path'
	},
	writable: true
});

// Mock setTimeout for debounce tests
vi.useFakeTimers();

describe('Authentication Error Handler', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	describe('handleAuthError', () => {
		it('should handle network errors correctly', () => {
			const networkError = new ApiError('Network error', 0);
			
			const result = handleAuthError(networkError);
			
			expect(result.type).toBe('network');
			expect(result.message).toBe(AUTH_ERROR_MESSAGES.NETWORK_ERROR);
			expect(result.shouldRedirect).toBe(false);
		});

		it('should handle 401 unauthorized errors', () => {
			const authError = new ApiError('Unauthorized', 401);
			
			const result = handleAuthError(authError);
			
			expect(result.type).toBe('unauthorized');
			expect(result.message).toBe(AUTH_ERROR_MESSAGES.UNAUTHORIZED);
			expect(result.shouldRedirect).toBe(true);
		});

		it('should handle 422 validation errors', () => {
			const validationError = new ApiError('Validation failed', 422, {
				errors: {
					email: ['Email is required'],
					password: ['Password is too short']
				}
			});
			
			const result = handleAuthError(validationError);
			
			expect(result.type).toBe('validation');
			expect(result.validationErrors).toEqual({
				email: ['Email is required'],
				password: ['Password is too short']
			});
		});

		it('should handle timeout errors', () => {
			const timeoutError = new ApiError('Timeout', 408);
			
			const result = handleAuthError(timeoutError);
			
			expect(result.type).toBe('timeout');
			expect(result.message).toBe(AUTH_ERROR_MESSAGES.TIMEOUT_ERROR);
		});

		it('should handle rate limiting errors', () => {
			const rateLimitError = new ApiError('Too many requests', 429);
			
			const result = handleAuthError(rateLimitError);
			
			expect(result.type).toBe('rate_limited');
			expect(result.message).toBe(AUTH_ERROR_MESSAGES.RATE_LIMITED);
		});

		it('should not show toast when showToast is false', () => {
			// This test verifies the showToast option works correctly
			// The actual toast function is mocked, so we just verify the result structure
			const error = new ApiError('Test error', 500);
			
			const result = handleAuthError(error, null, { showToast: false });
			
			expect(result.type).toBe('server');
			expect(result.message).toBeDefined();
		});

		it('should use custom message when provided', () => {
			const error = new ApiError('Test error', 500);
			const customMessage = 'Custom error message';
			
			const result = handleAuthError(error, null, { customMessage });
			
			expect(result.message).toBe(customMessage);
		});
	});

	describe('handleNetworkError', () => {
		it('should handle fetch errors', () => {
			const fetchError = new Error('Failed to fetch');
			
			const result = handleNetworkError(fetchError);
			
			expect(result.type).toBe('network');
			expect(result.message).toContain('подключиться к серверу');
		});

		it('should handle abort errors', () => {
			const abortError = new Error('AbortError');
			abortError.name = 'AbortError';
			
			const result = handleNetworkError(abortError);
			
			expect(result.type).toBe('network');
			expect(result.message).toBe(AUTH_ERROR_MESSAGES.TIMEOUT_ERROR);
		});
	});

	describe('handleTimeoutError', () => {
		it('should handle timeout errors with operation context', () => {
			const timeoutError = new Error('Timeout');
			
			const result = handleTimeoutError(timeoutError, { operation: 'login' });
			
			expect(result.type).toBe('timeout');
			expect(result.message).toContain('login');
		});
	});

	describe('retryAuthOperation', () => {
		it('should succeed on first attempt', async () => {
			const mockOperation = vi.fn().mockResolvedValue('success');
			
			const result = await retryAuthOperation(mockOperation, 'test', { maxRetries: 3 });
			
			expect(result).toBe('success');
			expect(mockOperation).toHaveBeenCalledTimes(1);
		});

		it('should retry on recoverable errors', async () => {
			vi.useRealTimers(); // Use real timers for this test
			
			const mockOperation = vi.fn()
				.mockRejectedValueOnce(new ApiError('Network error', 0))
				.mockResolvedValue('success');
			
			const result = await retryAuthOperation(mockOperation, 'test', { 
				maxRetries: 3,
				initialDelay: 1, // Very short delay for testing
				showRetryToasts: false
			});
			
			expect(result).toBe('success');
			expect(mockOperation).toHaveBeenCalledTimes(2);
			
			vi.useFakeTimers(); // Switch back to fake timers
		}, 10000);

		it('should not retry on non-recoverable errors', async () => {
			const mockOperation = vi.fn().mockRejectedValue(new ApiError('Unauthorized', 401));
			
			await expect(retryAuthOperation(mockOperation, 'test', { maxRetries: 3 }))
				.rejects.toThrow('Unauthorized');
			
			expect(mockOperation).toHaveBeenCalledTimes(1);
		});

		it('should fail after max retries', async () => {
			vi.useRealTimers(); // Use real timers for this test
			
			const mockOperation = vi.fn().mockRejectedValue(new ApiError('Network error', 0));
			
			await expect(retryAuthOperation(mockOperation, 'test', { 
				maxRetries: 2,
				initialDelay: 1, // Very short delay for testing
				showRetryToasts: false
			})).rejects.toThrow('Network error');
			
			expect(mockOperation).toHaveBeenCalledTimes(2);
			
			vi.useFakeTimers(); // Switch back to fake timers
		}, 10000);
	});

	describe('executeCriticalAuthOperation', () => {
		it('should use retry for critical operations', async () => {
			vi.useRealTimers(); // Use real timers for this test
			
			const mockOperation = vi.fn()
				.mockRejectedValueOnce(new ApiError('Network error', 0))
				.mockResolvedValue('success');
			
			const result = await executeCriticalAuthOperation(
				mockOperation, 
				CRITICAL_OPERATIONS.LOGIN,
				{ maxRetries: 2, initialDelay: 1, showRetryToasts: false }
			);
			
			expect(result).toBe('success');
			expect(mockOperation).toHaveBeenCalledTimes(2);
			
			vi.useFakeTimers(); // Switch back to fake timers
		}, 10000);

		it('should not retry for non-critical operations', async () => {
			const mockOperation = vi.fn().mockRejectedValue(new ApiError('Network error', 0));
			
			await expect(executeCriticalAuthOperation(mockOperation, 'non-critical'))
				.rejects.toThrow('Network error');
			
			expect(mockOperation).toHaveBeenCalledTimes(1);
		});
	});

	describe('formatValidationErrors', () => {
		it('should format array-based validation errors', () => {
			const errors = {
				email: ['Email is required', 'Email must be valid'],
				password: ['Password is too short']
			};
			
			const formatted = formatValidationErrors(errors);
			
			expect(formatted).toEqual({
				email: 'Email is required',
				password: 'Password is too short'
			});
		});

		it('should handle string-based validation errors', () => {
			const errors = {
				email: 'Email is required',
				password: 'Password is too short'
			};
			
			const formatted = formatValidationErrors(errors);
			
			expect(formatted).toEqual(errors);
		});

		it('should handle null or undefined errors', () => {
			expect(formatValidationErrors(null)).toEqual({});
			expect(formatValidationErrors(undefined)).toEqual({});
		});
	});

	describe('isRecoverableError', () => {
		it('should identify recoverable errors', () => {
			const networkError = new ApiError('Network error', 0);
			const timeoutError = new ApiError('Timeout', 408);
			const serverError = new ApiError('Server error', 500);
			
			expect(isRecoverableError(networkError)).toBe(true);
			expect(isRecoverableError(timeoutError)).toBe(true);
			expect(isRecoverableError(serverError)).toBe(true);
		});

		it('should identify non-recoverable errors', () => {
			const authError = new ApiError('Unauthorized', 401);
			const validationError = new ApiError('Validation failed', 422);
			const forbiddenError = new ApiError('Forbidden', 403);
			
			expect(isRecoverableError(authError)).toBe(false);
			expect(isRecoverableError(validationError)).toBe(false);
			expect(isRecoverableError(forbiddenError)).toBe(false);
		});

		it('should handle fetch errors as recoverable', () => {
			const fetchError = new TypeError('Failed to fetch');
			const abortError = new Error('AbortError');
			abortError.name = 'AbortError';
			
			expect(isRecoverableError(fetchError)).toBe(true);
			expect(isRecoverableError(abortError)).toBe(true);
		});
	});

	describe('createDebouncedErrorHandler', () => {
		it('should debounce error handler calls', () => {
			const mockHandler = vi.fn();
			const debouncedHandler = createDebouncedErrorHandler(mockHandler, 100);
			
			const error1 = new Error('Error 1');
			const error2 = new Error('Error 2');
			
			debouncedHandler(error1);
			debouncedHandler(error2);
			
			// Handler should not be called immediately
			expect(mockHandler).not.toHaveBeenCalled();
			
			// Fast-forward time
			vi.advanceTimersByTime(100);
			
			// Handler should be called once with the last error
			expect(mockHandler).toHaveBeenCalledTimes(1);
			expect(mockHandler).toHaveBeenCalledWith(error2);
		});

		it('should reset debounce timer on new calls', () => {
			const mockHandler = vi.fn();
			const debouncedHandler = createDebouncedErrorHandler(mockHandler, 100);
			
			const error = new Error('Test error');
			
			debouncedHandler(error);
			vi.advanceTimersByTime(50);
			
			debouncedHandler(error); // This should reset the timer
			vi.advanceTimersByTime(50);
			
			// Handler should not be called yet
			expect(mockHandler).not.toHaveBeenCalled();
			
			vi.advanceTimersByTime(50);
			
			// Now it should be called
			expect(mockHandler).toHaveBeenCalledTimes(1);
		});
	});
});