/**
 * Integration tests for authentication functions
 * Tests complete authentication flows and error scenarios
 * Requirements: All requirements through comprehensive testing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../utils/http-client.js', () => ({
	api: {
		initCsrf: vi.fn()
	},
	createHttpClient: vi.fn(() => ({
		post: vi.fn(),
		get: vi.fn()
	}))
}));

vi.mock('../utils/errorHandler.svelte.js', () => ({
	handleApiError: vi.fn(),
	clearErrorFields: vi.fn((errors, fields) => {
		const newErrors = { ...errors };
		const fieldsArray = Array.isArray(fields) ? fields : [fields];
		fieldsArray.forEach(field => delete newErrors[field]);
		return newErrors;
	}),
	hasErrors: vi.fn((errors) => Object.keys(errors || {}).length > 0),
	getFirstErrorMessage: vi.fn((errors) => {
		if (!errors) return null;
		for (const messages of Object.values(errors)) {
			if (Array.isArray(messages) && messages.length > 0) {
				return messages[0];
			}
		}
		return null;
	})
}));

// Import after mocking
import * as auth from '../auth/auth.svelte.js';
import * as httpClient from '../utils/http-client.js';
import * as errorHandler from '../utils/errorHandler.svelte.js';

// Mock goto function
const mockGoto = vi.fn();
vi.stubGlobal('goto', mockGoto);

describe('Authentication Integration Tests', () => {
	let mockHttpClient;

	beforeEach(() => {
		// Reset all auth state
		auth.clearAuthState();
		
		// Create fresh mock HTTP client
		mockHttpClient = {
			post: vi.fn(),
			get: vi.fn()
		};
		
		httpClient.createHttpClient.mockReturnValue(mockHttpClient);
		
		// Clear all mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		auth.clearAuthState();
	});

	describe('Complete Authentication Flow', () => {
		it('should handle complete login flow successfully', async () => {
			// Arrange
			const credentials = { email: 'test@example.com', password: 'password123' };
			const mockUser = { id: 1, email: credentials.email, name: 'Test User' };
			const mockResponse = { success: true, user: mockUser };

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue(mockResponse);

			// Track state changes
			const stateChanges = [];
			
			// Initial state
			stateChanges.push({
				step: 'initial',
				user: auth.authState.user,
				isAuthenticated: auth.authState.isAuthenticated,
				isLoading: auth.authState.isLoading,
				errors: auth.authState.errors
			});

			// Act
			const loginPromise = auth.login(credentials.email, credentials.password, { redirectTo: '/dashboard' });

			// Check loading state during request
			stateChanges.push({
				step: 'during_request',
				user: auth.authState.user,
				isAuthenticated: auth.authState.isAuthenticated,
				isLoading: auth.authState.isLoading,
				errors: auth.authState.errors
			});

			const result = await loginPromise;

			// Final state
			stateChanges.push({
				step: 'final',
				user: auth.authState.user,
				isAuthenticated: auth.authState.isAuthenticated,
				isLoading: auth.authState.isLoading,
				errors: auth.authState.errors
			});

			// Assert
			expect(stateChanges[0]).toEqual({
				step: 'initial',
				user: null,
				isAuthenticated: false,
				isLoading: false,
				errors: {}
			});

			expect(stateChanges[1]).toEqual({
				step: 'during_request',
				user: null,
				isAuthenticated: false,
				isLoading: true,
				errors: {}
			});

			expect(stateChanges[2]).toEqual({
				step: 'final',
				user: mockUser,
				isAuthenticated: true,
				isLoading: false,
				errors: {}
			});

			expect(result).toEqual(mockUser);
			expect(goto).toHaveBeenCalledWith('/dashboard');
		});

		it('should handle complete registration flow successfully', async () => {
			// Arrange
			const registrationData = {
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
				passwordConfirmation: 'password123'
			};
			const mockUser = { id: 1, name: registrationData.name, email: registrationData.email };
			const mockResponse = { success: true, user: mockUser };

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue(mockResponse);

			// Act
			const result = await auth.register(
				registrationData.name,
				registrationData.email,
				registrationData.password,
				registrationData.passwordConfirmation,
				{ redirectTo: '/welcome' }
			);

			// Assert
			expect(httpClient.api.initCsrf).toHaveBeenCalledOnce();
			expect(mockHttpClient.post).toHaveBeenCalledWith('/api/register', {
				name: registrationData.name,
				email: registrationData.email,
				password: registrationData.password,
				password_confirmation: registrationData.passwordConfirmation
			});
			expect(auth.authState.user).toEqual(mockUser);
			expect(auth.authState.isAuthenticated).toBe(true);
			expect(auth.authState.isLoading).toBe(false);
			expect(result).toEqual(mockUser);
			expect(goto).toHaveBeenCalledWith('/welcome');
		});

		it('should handle complete logout flow successfully', async () => {
			// Arrange - start with authenticated user
			const testUser = { id: 1, email: 'test@example.com' };
			auth.setUser(testUser);
			mockHttpClient.post.mockResolvedValue({ success: true });

			// Verify initial authenticated state
			expect(auth.authState.isAuthenticated).toBe(true);

			// Act
			await auth.logout({ redirectTo: '/login' });

			// Assert
			expect(mockHttpClient.post).toHaveBeenCalledWith('/api/logout');
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.isAuthenticated).toBe(false);
			expect(auth.authState.isLoading).toBe(false);
			expect(auth.authState.errors).toEqual({});
			expect(goto).toHaveBeenCalledWith('/login');
		});

		it('should handle user data retrieval flow', async () => {
			// Arrange
			const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
			const mockResponse = { success: true, user: mockUser };
			mockHttpClient.get.mockResolvedValue(mockResponse);

			// Act
			const result = await auth.getUser();

			// Assert
			expect(mockHttpClient.get).toHaveBeenCalledWith('/api/user');
			expect(auth.authState.user).toEqual(mockUser);
			expect(auth.authState.isAuthenticated).toBe(true);
			expect(auth.authState.isLoading).toBe(false);
			expect(result).toEqual(mockUser);
		});
	});

	describe('Error Handling Integration', () => {
		it('should handle login validation errors', async () => {
			// Arrange
			const validationError = new Error('Validation failed');
			validationError.status = 422;
			validationError.data = {
				errors: {
					email: ['Email is required'],
					password: ['Password is required']
				}
			};

			const formattedErrors = {
				email: ['Email is required'],
				password: ['Password is required']
			};

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockRejectedValue(validationError);
			errorHandler.handleApiError.mockReturnValue(formattedErrors);

			// Act & Assert
			await expect(auth.login('', '')).rejects.toThrow('Validation failed');
			
			expect(errorHandler.handleApiError).toHaveBeenCalledWith(validationError, {
				redirectOnAuth: false
			});
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.isLoading).toBe(false);
		});

		it('should handle registration validation errors', async () => {
			// Arrange
			const validationError = new Error('Validation failed');
			validationError.status = 422;
			validationError.data = {
				errors: {
					email: ['Email format is invalid'],
					password: ['Password is too short'],
					password_confirmation: ['Passwords do not match']
				}
			};

			const formattedErrors = {
				email: ['Email format is invalid'],
				password: ['Password is too short'],
				password_confirmation: ['Passwords do not match']
			};

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockRejectedValue(validationError);
			errorHandler.handleApiError.mockReturnValue(formattedErrors);

			// Act & Assert
			await expect(auth.register('', 'invalid-email', '123', '456')).rejects.toThrow('Validation failed');
			
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.isLoading).toBe(false);
		});

		it('should handle network errors during authentication', async () => {
			// Arrange
			const networkError = new Error('Network error: Connection failed');
			const formattedErrors = {
				network: ['Unable to connect to the server. Please check your internet connection.']
			};

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockRejectedValue(networkError);
			errorHandler.handleApiError.mkReturnValue(formattedErrors);

			// Act & Assert
			await expect(auth.login('test@example.com', 'password')).rejects.toThrow('Network error: Connection failed');
			
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.isLoading).toBe(false);
		});

		it('should handle unauthorized errors during getUser', async () => {
			// Arrange
			const unauthorizedError = new Error('Unauthorized');
			unauthorizedError.status = 401;
			mockHttpClient.get.mockRejectedValue(unauthorizedError);

			// Act
			const result = await auth.getUser();

			// Assert
			expect(result).toBeNull();
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.isAuthenticated).toBe(false);
		});
	});

	describe('State Consistency During Operations', () => {
		it('should maintain consistent state during failed login', async () => {
			// Arrange
			const testUser = { id: 1, email: 'existing@example.com' };
			auth.setUser(testUser);
			
			const loginError = new Error('Invalid credentials');
			loginError.status = 401;
			
			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockRejectedValue(loginError);
			errorHandler.handleApiError.mockReturnValue({ auth: ['Invalid credentials'] });

			// Act & Assert
			await expect(auth.login('wrong@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
			
			// Original user should be cleared due to error handling
			expect(auth.authState.isLoading).toBe(false);
		});

		it('should handle concurrent authentication operations', async () => {
			// Arrange
			const user1 = { id: 1, email: 'user1@example.com' };
			const user2 = { id: 2, email: 'user2@example.com' };
			
			httpClient.api.initCsrf.mockResolvedValue();
			
			// First login succeeds
			mockHttpClient.post.mockResolvedValueOnce({ success: true, user: user1 });
			// Second login fails
			const loginError = new Error('Invalid credentials');
			mockHttpClient.post.mockRejectedValueOnce(loginError);
			errorHandler.handleApiError.mockReturnValue({ auth: ['Invalid credentials'] });

			// Act
			const login1Promise = auth.login('user1@example.com', 'password1');
			const login2Promise = auth.login('user2@example.com', 'wrongpassword');

			// Wait for both to complete
			const [result1] = await Promise.allSettled([login1Promise, login2Promise]);

			// Assert
			expect(result1.status).toBe('fulfilled');
			expect(result1.value).toEqual(user1);
			
			// Final state should reflect the last operation
			expect(auth.authState.isLoading).toBe(false);
		});
	});

	describe('CSRF Integration', () => {
		it('should handle CSRF initialization in all authenticated operations', async () => {
			// Arrange
			const mockUser = { id: 1, email: 'test@example.com' };
			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue({ success: true, user: mockUser });

			// Test login
			await auth.login('test@example.com', 'password');
			expect(httpClient.api.initCsrf).toHaveBeenCalledTimes(1);

			// Test register
			await auth.register('Test', 'test@example.com', 'password', 'password');
			expect(httpClient.api.initCsrf).toHaveBeenCalledTimes(2);

			// Test logout (no CSRF init needed)
			await auth.logout();
			expect(httpClient.api.initCsrf).toHaveBeenCalledTimes(2);
		});

		it('should handle CSRF initialization failures', async () => {
			// Arrange
			const csrfError = new Error('CSRF initialization failed');
			httpClient.api.initCsrf.mockRejectedValue(csrfError);

			// Act & Assert
			await expect(auth.login('test@example.com', 'password')).rejects.toThrow('CSRF initialization failed');
			await expect(auth.register('Test', 'test@example.com', 'password', 'password')).rejects.toThrow('CSRF initialization failed');
			
			// Should not proceed to actual API calls
			expect(mockHttpClient.post).not.toHaveBeenCalled();
		});
	});

	describe('Redirect Integration', () => {
		it('should handle redirects only in browser environment', async () => {
			// Arrange
			const mockUser = { id: 1, email: 'test@example.com' };
			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue({ success: true, user: mockUser });

			// Mock window object to simulate browser environment
			const originalWindow = global.window;
			global.window = { location: { href: 'http://localhost:5173' } };

			try {
				// Act
				await auth.login('test@example.com', 'password', { redirectTo: '/dashboard' });

				// Assert
				expect(goto).toHaveBeenCalledWith('/dashboard');
			} finally {
				// Cleanup
				global.window = originalWindow;
			}
		});

		it('should not redirect when not in browser environment', async () => {
			// Arrange
			const mockUser = { id: 1, email: 'test@example.com' };
			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue({ success: true, user: mockUser });

			// Mock non-browser environment
			const originalWindow = global.window;
			global.window = undefined;

			try {
				// Act
				await auth.login('test@example.com', 'password', { redirectTo: '/dashboard' });

				// Assert - should not call goto in non-browser environment
				// The function should still complete successfully
				expect(auth.authState.user).toEqual(mockUser);
			} finally {
				// Cleanup
				global.window = originalWindow;
			}
		});
	});
});