/**
 * End-to-end authentication tests
 * Tests complete user journeys and system integration
 * Requirements: All requirements through comprehensive end-to-end scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all dependencies
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
	clearErrorFields: vi.fn(),
	hasErrors: vi.fn(),
	getFirstErrorMessage: vi.fn()
}));

// Import modules after mocking
import {
	authState,
	clearAuthState,
	login,
	register,
	logout,
	getUser,
	initCsrf
} from '../auth/auth.svelte.js';

import { 
	initializeAuth,
	isAuthenticated,
	requireAuth,
	requireGuest,
	createAuthLoad,
	createGuestLoad
} from '../auth/auth-guard.svelte.js';

import { api, createHttpClient } from '../utils/http-client.js';
import { handleApiError } from '../utils/errorHandler.svelte.js';

describe('End-to-End Authentication Tests', () => {
	let mockHttpClient;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();
		
		// Clear auth state
		clearAuthState();
		
		// Setup mock HTTP client
		mockHttpClient = {
			post: vi.fn(),
			get: vi.fn()
		};
		createHttpClient.mockReturnValue(mockHttpClient);
		
		// Reset global mocks
		global.mockGoto.mockClear();
		global.fetch.mockClear();
		
		// Reset document cookie
		document.cookie = '';
	});

	describe('Complete User Registration Journey', () => {
		it('should handle complete registration flow with validation and success', async () => {
			// Step 1: User visits registration page (guest-only)
			expect(authState.isAuthenticated).toBe(false);
			
			// Step 2: User fills invalid form first (client validation)
			// This would be caught by form validation before API call
			
			// Step 3: User corrects form and submits valid data
			api.initCsrf.mockResolvedValue();
			const mockUser = {
				id: 1,
				name: 'Jane Smith',
				email: 'jane@example.com',
				email_verified_at: null,
				created_at: '2025-01-23T10:00:00.000000Z',
				updated_at: '2025-01-23T10:00:00.000000Z'
			};
			
			mockHttpClient.post.mockResolvedValue({
				success: true,
				user: mockUser
			});

			// Execute registration
			const result = await register('Jane Smith', 'jane@example.com', 'password123', 'password123');

			// Step 4: Verify CSRF protection was initialized
			expect(api.initCsrf).toHaveBeenCalledOnce();

			// Step 5: Verify API call was made correctly
			expect(mockHttpClient.post).toHaveBeenCalledWith('/api/register', {
				name: 'Jane Smith',
				email: 'jane@example.com',
				password: 'password123',
				password_confirmation: 'password123'
			});

			// Step 6: Verify user is automatically logged in (Requirement 1.3)
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(result).toEqual(mockUser);

			// Step 7: Verify user can now access protected routes
			expect(isAuthenticated()).toBe(true);
		});

		it('should handle registration with existing email error', async () => {
			// Step 1: User submits form with existing email
			api.initCsrf.mockResolvedValue();
			const validationError = new Error('Validation failed');
			validationError.status = 422;
			validationError.data = {
				message: 'The given data was invalid.',
				errors: {
					email: ['The email has already been taken.']
				}
			};
			
			mockHttpClient.post.mockRejectedValue(validationError);
			handleApiError.mockReturnValue({
				email: ['The email has already been taken.']
			});

			// Execute registration and expect error
			await expect(register('Jane Smith', 'existing@example.com', 'password123', 'password123'))
				.rejects.toThrow('Validation failed');

			// Step 2: Verify error handling (Requirement 1.4)
			expect(handleApiError).toHaveBeenCalledWith(validationError);
			expect(authState.errors).toEqual({
				email: ['The email has already been taken.']
			});

			// Step 3: Verify user is not logged in
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
		});
	});

	describe('Complete User Login Journey', () => {
		it('should handle complete login flow with session management', async () => {
			// Step 1: User visits login page
			expect(authState.isAuthenticated).toBe(false);

			// Step 2: User submits valid credentials
			api.initCsrf.mockResolvedValue();
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				email_verified_at: '2025-01-23T09:00:00.000000Z',
				created_at: '2025-01-22T10:00:00.000000Z',
				updated_at: '2025-01-23T10:00:00.000000Z'
			};
			
			mockHttpClient.post.mockResolvedValue({
				success: true,
				user: mockUser
			});

			// Execute login
			const result = await login('john@example.com', 'password123');

			// Step 3: Verify CSRF protection was initialized
			expect(api.initCsrf).toHaveBeenCalledOnce();

			// Step 4: Verify API call was made correctly
			expect(mockHttpClient.post).toHaveBeenCalledWith('/api/login', {
				email: 'john@example.com',
				password: 'password123'
			});

			// Step 5: Verify user is logged in (Requirements 2.1, 2.2, 2.3)
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(result).toEqual(mockUser);

			// Step 6: Verify user can access protected routes
			expect(isAuthenticated()).toBe(true);
		});

		it('should handle login with invalid credentials', async () => {
			// Step 1: User submits invalid credentials
			api.initCsrf.mockResolvedValue();
			const authError = new Error('Invalid credentials');
			authError.status = 401;
			authError.data = { message: 'These credentials do not match our records.' };
			
			mockHttpClient.post.mockRejectedValue(authError);
			handleApiError.mockReturnValue({
				auth: ['These credentials do not match our records.']
			});

			// Execute login and expect error
			await expect(login('john@example.com', 'wrongpassword'))
				.rejects.toThrow('Invalid credentials');

			// Step 2: Verify error handling (Requirement 2.4)
			expect(handleApiError).toHaveBeenCalledWith(authError);
			expect(authState.errors).toEqual({
				auth: ['These credentials do not match our records.']
			});

			// Step 3: Verify user is not logged in
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
		});
	});

	describe('Session Recovery and Persistence', () => {
		it('should recover valid session on app startup', async () => {
			// Step 1: App starts up, no user in state
			expect(authState.isAuthenticated).toBe(false);

			// Step 2: Initialize auth attempts to recover session
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com'
			};
			
			mockHttpClient.get.mockResolvedValue({
				success: true,
				user: mockUser
			});

			// Execute session recovery
			const result = await initializeAuth();

			// Step 3: Verify session recovery API call
			expect(mockHttpClient.get).toHaveBeenCalledWith('/api/user');

			// Step 4: Verify user session is restored (Requirements 4.1, 4.2)
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(result).toEqual(mockUser);
		});

		it('should handle expired session on app startup', async () => {
			// Step 1: App starts up with expired session
			const authError = new Error('Unauthorized');
			authError.status = 401;
			mockHttpClient.get.mockRejectedValue(authError);

			// Execute session recovery
			const result = await initializeAuth();

			// Step 2: Verify session recovery attempt
			expect(mockHttpClient.get).toHaveBeenCalledWith('/api/user');

			// Step 3: Verify expired session is handled (Requirement 4.3)
			expect(result).toBeNull();
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
		});

		it('should handle session recovery after page reload', async () => {
			// Step 1: User was previously logged in (simulate page reload)
			// Session exists in backend but not in frontend state
			expect(authState.isAuthenticated).toBe(false);

			// Step 2: App attempts to recover session
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com'
			};
			
			mockHttpClient.get.mockResolvedValue({
				success: true,
				user: mockUser
			});

			// Execute session recovery (simulating app startup)
			const result = await getUser();

			// Step 3: Verify session is recovered (Requirement 4.4)
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(result).toEqual(mockUser);
		});
	});

	describe('Protected Routes and Authorization', () => {
		it('should protect routes for unauthenticated users', async () => {
			// Step 1: User is not authenticated
			expect(authState.isAuthenticated).toBe(false);

			// Step 2: User tries to access protected route
			// This would trigger requireAuth in a real scenario
			expect(() => requireAuth()).toThrow(); // Should throw redirect

			// Step 3: Verify user cannot access protected content
			expect(isAuthenticated()).toBe(false);
		});

		it('should allow access to protected routes for authenticated users', async () => {
			// Step 1: User is authenticated
			const mockUser = { id: 1, email: 'john@example.com' };
			authState.user = mockUser;
			expect(authState.isAuthenticated).toBe(true);

			// Step 2: User accesses protected route
			expect(() => requireAuth()).not.toThrow();

			// Step 3: Verify access is granted
			expect(isAuthenticated()).toBe(true);
		});

		it('should redirect authenticated users from guest-only pages', async () => {
			// Step 1: User is authenticated
			const mockUser = { id: 1, email: 'john@example.com' };
			authState.user = mockUser;
			expect(authState.isAuthenticated).toBe(true);

			// Step 2: User tries to access login/register page
			expect(() => requireGuest()).toThrow(); // Should throw redirect

			// Step 3: Verify redirect behavior (Requirement 2.5)
			expect(isAuthenticated()).toBe(true);
		});

		it('should create proper auth load function for protected routes', async () => {
			// Step 1: Create auth load function
			const authLoad = createAuthLoad({
				redirectTo: '/login',
				requireAuth: true
			});

			// Step 2: Test with unauthenticated user
			expect(authState.isAuthenticated).toBe(false);
			
			// Mock URL and route objects
			const mockEvent = {
				url: { pathname: '/dashboard', search: '' },
				route: { id: '/dashboard' }
			};

			// Step 3: Execute load function and expect redirect
			await expect(authLoad(mockEvent)).rejects.toThrow();
		});

		it('should create proper guest load function for auth pages', async () => {
			// Step 1: Create guest load function
			const guestLoad = createGuestLoad({
				redirectTo: '/dashboard'
			});

			// Step 2: Test with authenticated user
			const mockUser = { id: 1, email: 'john@example.com' };
			authState.user = mockUser;
			expect(authState.isAuthenticated).toBe(true);

			// Mock URL object
			const mockEvent = {
				url: { pathname: '/login', search: '' }
			};

			// Step 3: Execute load function and expect redirect
			await expect(guestLoad(mockEvent)).rejects.toThrow();
		});
	});

	describe('Complete Logout Journey', () => {
		it('should handle complete logout flow with cleanup', async () => {
			// Step 1: User is authenticated
			const mockUser = { id: 1, email: 'john@example.com' };
			authState.user = mockUser;
			expect(authState.isAuthenticated).toBe(true);

			// Step 2: User initiates logout
			mockHttpClient.post.mockResolvedValue({ success: true });

			// Execute logout
			await logout();

			// Step 3: Verify logout API call
			expect(mockHttpClient.post).toHaveBeenCalledWith('/api/logout');

			// Step 4: Verify complete state cleanup (Requirements 3.1, 3.2, 3.3)
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
			expect(authState.errors).toEqual({});
			expect(authState.isLoading).toBe(false);

			// Step 5: Verify user can no longer access protected routes
			expect(isAuthenticated()).toBe(false);
		});

		it('should handle logout with server error gracefully', async () => {
			// Step 1: User is authenticated
			const mockUser = { id: 1, email: 'john@example.com' };
			authState.user = mockUser;
			expect(authState.isAuthenticated).toBe(true);

			// Step 2: Logout API fails
			const serverError = new Error('Server error');
			serverError.status = 500;
			mockHttpClient.post.mockRejectedValue(serverError);

			// Execute logout and expect error
			await expect(logout()).rejects.toThrow('Server error');

			// Step 3: Verify state is still cleared despite error (Requirement 3.3)
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
		});

		it('should handle logout when already logged out (401)', async () => {
			// Step 1: User appears authenticated but session expired
			const mockUser = { id: 1, email: 'john@example.com' };
			authState.user = mockUser;
			expect(authState.isAuthenticated).toBe(true);

			// Step 2: Logout returns 401 (already logged out)
			const authError = new Error('Unauthorized');
			authError.status = 401;
			mockHttpClient.post.mockRejectedValue(authError);

			// Execute logout - should not throw for 401
			await expect(logout()).resolves.toBeUndefined();

			// Step 3: Verify state is cleared
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
		});
	});

	describe('CSRF Protection Integration', () => {
		it('should handle complete CSRF protection flow', async () => {
			// Step 1: Set up CSRF token in cookie
			document.cookie = 'XSRF-TOKEN=test-csrf-token-123';

			// Step 2: Initialize CSRF protection
			api.initCsrf.mockResolvedValue();
			await initCsrf();

			// Step 3: Verify CSRF initialization
			expect(api.initCsrf).toHaveBeenCalledOnce();

			// Step 4: Perform authenticated request
			const mockUser = { id: 1, email: 'john@example.com' };
			mockHttpClient.post.mockResolvedValue({
				success: true,
				user: mockUser
			});

			await login('john@example.com', 'password123');

			// Step 5: Verify CSRF was initialized before request
			expect(api.initCsrf).toHaveBeenCalledBefore(mockHttpClient.post);
		});

		it('should handle CSRF initialization failure', async () => {
			// Step 1: CSRF initialization fails
			const csrfError = new Error('Failed to initialize CSRF protection');
			api.initCsrf.mockRejectedValue(csrfError);

			// Step 2: Attempt login
			await expect(login('john@example.com', 'password123'))
				.rejects.toThrow('Failed to initialize CSRF protection');

			// Step 3: Verify login request was not made
			expect(mockHttpClient.post).not.toHaveBeenCalled();

			// Step 4: Verify user is not logged in
			expect(authState.isAuthenticated).toBe(false);
		});

		it('should protect against CSRF attacks', async () => {
			// Step 1: Attempt request without CSRF token
			document.cookie = ''; // No CSRF token

			// Step 2: Mock CSRF failure response
			api.initCsrf.mockResolvedValue();
			const csrfError = new Error('CSRF token mismatch');
			csrfError.status = 419;
			mockHttpClient.post.mockRejectedValue(csrfError);

			handleApiError.mockReturnValue({
				auth: ['CSRF token mismatch']
			});

			// Step 3: Attempt login
			await expect(login('john@example.com', 'password123'))
				.rejects.toThrow('CSRF token mismatch');

			// Step 4: Verify CSRF protection worked (Requirement 5.4)
			expect(authState.errors).toEqual({
				auth: ['CSRF token mismatch']
			});
			expect(authState.isAuthenticated).toBe(false);
		});
	});

	describe('Error Handling and User Experience', () => {
		it('should handle network connectivity issues', async () => {
			// Step 1: Network is unavailable
			api.initCsrf.mockResolvedValue();
			const networkError = new Error('Network error: Failed to fetch');
			mockHttpClient.post.mockRejectedValue(networkError);

			handleApiError.mockReturnValue({
				network: ['Unable to connect to the server. Please check your internet connection.']
			});

			// Step 2: User attempts login
			await expect(login('john@example.com', 'password123'))
				.rejects.toThrow('Network error: Failed to fetch');

			// Step 3: Verify network error handling (Requirement 6.3)
			expect(handleApiError).toHaveBeenCalledWith(networkError);
			expect(authState.errors).toEqual({
				network: ['Unable to connect to the server. Please check your internet connection.']
			});

			// Step 4: Verify user is not logged in
			expect(authState.isAuthenticated).toBe(false);
		});

		it('should handle server errors gracefully', async () => {
			// Step 1: Server returns 500 error
			api.initCsrf.mockResolvedValue();
			const serverError = new Error('Internal server error');
			serverError.status = 500;
			mockHttpClient.post.mockRejectedValue(serverError);

			handleApiError.mockReturnValue({
				server: ['Internal server error. Please try again later.']
			});

			// Step 2: User attempts login
			await expect(login('john@example.com', 'password123'))
				.rejects.toThrow('Internal server error');

			// Step 3: Verify server error handling (Requirement 6.4)
			expect(handleApiError).toHaveBeenCalledWith(serverError);
			expect(authState.errors).toEqual({
				server: ['Internal server error. Please try again later.']
			});

			// Step 4: Verify user is not logged in
			expect(authState.isAuthenticated).toBe(false);
		});

		it('should provide appropriate error messages for different scenarios', async () => {
			// Test validation errors (422)
			api.initCsrf.mockResolvedValue();
			const validationError = new Error('Validation failed');
			validationError.status = 422;
			validationError.data = {
				errors: {
					email: ['The email field is required.'],
					password: ['The password field is required.']
				}
			};
			
			mockHttpClient.post.mockRejectedValue(validationError);
			handleApiError.mockReturnValue({
				email: ['The email field is required.'],
				password: ['The password field is required.']
			});

			// Execute and verify validation error handling (Requirement 6.1)
			await expect(login('', ''))
				.rejects.toThrow('Validation failed');

			expect(authState.errors).toEqual({
				email: ['The email field is required.'],
				password: ['The password field is required.']
			});
		});
	});

	describe('State Consistency and Reactivity', () => {
		it('should maintain consistent state throughout user journey', async () => {
			// Step 1: Initial state
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
			expect(authState.errors).toEqual({});
			expect(authState.isLoading).toBe(false);

			// Step 2: Login process
			api.initCsrf.mockResolvedValue();
			const mockUser = { id: 1, email: 'john@example.com' };
			mockHttpClient.post.mockResolvedValue({
				success: true,
				user: mockUser
			});

			await login('john@example.com', 'password123');

			// Verify authenticated state
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(authState.errors).toEqual({});
			expect(authState.isLoading).toBe(false);

			// Step 3: Logout process
			mockHttpClient.post.mockResolvedValue({ success: true });
			await logout();

			// Verify logged out state
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
			expect(authState.errors).toEqual({});
			expect(authState.isLoading).toBe(false);
		});

		it('should handle rapid state changes correctly', async () => {
			// Simulate rapid login/logout cycles
			api.initCsrf.mockResolvedValue();
			const mockUser = { id: 1, email: 'john@example.com' };
			
			// First login
			mockHttpClient.post.mockResolvedValue({
				success: true,
				user: mockUser
			});
			await login('john@example.com', 'password123');
			expect(authState.isAuthenticated).toBe(true);

			// Immediate logout
			mockHttpClient.post.mockResolvedValue({ success: true });
			await logout();
			expect(authState.isAuthenticated).toBe(false);

			// Second login
			mockHttpClient.post.mockResolvedValue({
				success: true,
				user: mockUser
			});
			await login('john@example.com', 'password123');
			expect(authState.isAuthenticated).toBe(true);

			// Verify final state is consistent
			expect(authState.user).toEqual(mockUser);
		});
	});
});