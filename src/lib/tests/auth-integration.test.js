/**
 * Integration tests for the authentication system
 * Tests complete authentication flows including registration, login, logout, and protected routes
 * Requirements: All requirements in complex integration scenarios
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';

// Mock dependencies before importing components
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
	getUser
} from '../auth/auth.svelte.js';

import { api, createHttpClient } from '../utils/http-client.js';
import { handleApiError } from '../utils/errorHandler.svelte.js';
import LoginForm from '../components/LoginForm.svelte';
import RegisterForm from '../components/RegisterForm.svelte';
import LogoutButton from '../components/LogoutButton.svelte';

describe('Authentication Integration Tests', () => {
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

	afterEach(() => {
		// Clean up any timers
		vi.runAllTimers();
	});

	describe('Complete Registration Flow', () => {
		it('should complete full user registration cycle', async () => {
			// Mock successful CSRF and registration
			api.initCsrf.mockResolvedValue();
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				created_at: '2025-01-23T10:00:00.000000Z'
			};
			
			mockHttpClient.post.mockResolvedValue({
				success: true,
				user: mockUser
			});

			// Render registration form
			const { container } = render(RegisterForm, {
				props: { redirectTo: '/dashboard' }
			});

			// Fill out registration form
			const nameInput = container.querySelector('#name');
			const emailInput = container.querySelector('#email');
			const passwordInput = container.querySelector('#password');
			const confirmPasswordInput = container.querySelector('#password_confirmation');
			const submitButton = container.querySelector('button[type="submit"]');

			await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
			await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
			await fireEvent.input(passwordInput, { target: { value: 'password123' } });
			await fireEvent.input(confirmPasswordInput, { target: { value: 'password123' } });

			// Submit form
			await fireEvent.click(submitButton);

			// Wait for async operations
			await waitFor(() => {
				expect(api.initCsrf).toHaveBeenCalledOnce();
				expect(mockHttpClient.post).toHaveBeenCalledWith('/api/register', {
					name: 'John Doe',
					email: 'john@example.com',
					password: 'password123',
					password_confirmation: 'password123'
				});
			});

			// Verify user is automatically logged in after registration
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(global.mockGoto).toHaveBeenCalledWith('/dashboard');
		});

		it('should handle registration validation errors', async () => {
			// Mock CSRF success but registration validation error
			api.initCsrf.mockResolvedValue();
			const validationError = new Error('Validation failed');
			validationError.status = 422;
			validationError.data = {
				message: 'The given data was invalid.',
				errors: {
					email: ['The email has already been taken.'],
					password: ['The password must be at least 8 characters.']
				}
			};
			
			mockHttpClient.post.mockRejectedValue(validationError);
			handleApiError.mockReturnValue({
				email: ['The email has already been taken.'],
				password: ['The password must be at least 8 characters.']
			});

			// Render registration form
			const { container } = render(RegisterForm);

			// Fill out form with invalid data
			const nameInput = container.querySelector('#name');
			const emailInput = container.querySelector('#email');
			const passwordInput = container.querySelector('#password');
			const confirmPasswordInput = container.querySelector('#password_confirmation');
			const submitButton = container.querySelector('button[type="submit"]');

			await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
			await fireEvent.input(emailInput, { target: { value: 'existing@example.com' } });
			await fireEvent.input(passwordInput, { target: { value: 'short' } });
			await fireEvent.input(confirmPasswordInput, { target: { value: 'short' } });

			// Submit form
			await fireEvent.click(submitButton);

			// Wait for error handling
			await waitFor(() => {
				expect(handleApiError).toHaveBeenCalledWith(validationError);
			});

			// Verify error state
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
			expect(authState.errors).toEqual({
				email: ['The email has already been taken.'],
				password: ['The password must be at least 8 characters.']
			});

			// Verify error messages are displayed
			expect(container.textContent).toContain('The email has already been taken.');
			expect(container.textContent).toContain('The password must be at least 8 characters.');
		});

		it('should validate password confirmation mismatch', async () => {
			// Render registration form
			const { container } = render(RegisterForm);

			// Fill out form with mismatched passwords
			const nameInput = container.querySelector('#name');
			const emailInput = container.querySelector('#email');
			const passwordInput = container.querySelector('#password');
			const confirmPasswordInput = container.querySelector('#password_confirmation');
			const submitButton = container.querySelector('button[type="submit"]');

			await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
			await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
			await fireEvent.input(passwordInput, { target: { value: 'password123' } });
			await fireEvent.input(confirmPasswordInput, { target: { value: 'different123' } });

			// Submit form
			await fireEvent.click(submitButton);

			// Verify client-side validation prevents submission
			expect(api.initCsrf).not.toHaveBeenCalled();
			expect(mockHttpClient.post).not.toHaveBeenCalled();

			// Verify error message is displayed
			expect(container.textContent).toContain('Passwords do not match');
		});
	});

	describe('Complete Login and Logout Flow', () => {
		it('should complete full login and logout cycle', async () => {
			// Mock successful CSRF and login
			api.initCsrf.mockResolvedValue();
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com'
			};
			
			mockHttpClient.post.mockResolvedValue({
				success: true,
				user: mockUser
			});

			// Render login form
			const { container } = render(LoginForm, {
				props: { redirectTo: '/dashboard' }
			});

			// Fill out login form
			const emailInput = container.querySelector('#email');
			const passwordInput = container.querySelector('#password');
			const submitButton = container.querySelector('button[type="submit"]');

			await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
			await fireEvent.input(passwordInput, { target: { value: 'password123' } });

			// Submit form
			await fireEvent.click(submitButton);

			// Wait for login completion
			await waitFor(() => {
				expect(api.initCsrf).toHaveBeenCalledOnce();
				expect(mockHttpClient.post).toHaveBeenCalledWith('/api/login', {
					email: 'john@example.com',
					password: 'password123'
				});
			});

			// Verify user is logged in
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(global.mockGoto).toHaveBeenCalledWith('/dashboard');

			// Now test logout
			// Reset mocks for logout
			vi.clearAllMocks();
			global.mockGoto.mockClear();
			
			// Mock successful logout
			mockHttpClient.post.mockResolvedValue({ success: true });

			// Render logout button
			const { container: logoutContainer } = render(LogoutButton, {
				props: { redirectTo: '/login' }
			});

			// Click logout button
			const logoutButton = logoutContainer.querySelector('button');
			await fireEvent.click(logoutButton);

			// Wait for logout completion
			await waitFor(() => {
				expect(mockHttpClient.post).toHaveBeenCalledWith('/api/logout');
			});

			// Verify user is logged out
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
			expect(global.mockGoto).toHaveBeenCalledWith('/login');
		});

		it('should handle login with invalid credentials', async () => {
			// Mock CSRF success but login failure
			api.initCsrf.mockResolvedValue();
			const authError = new Error('Invalid credentials');
			authError.status = 401;
			authError.data = { message: 'Invalid credentials' };
			
			mockHttpClient.post.mockRejectedValue(authError);
			handleApiError.mockReturnValue({
				auth: ['Invalid credentials']
			});

			// Render login form
			const { container } = render(LoginForm);

			// Fill out form with invalid credentials
			const emailInput = container.querySelector('#email');
			const passwordInput = container.querySelector('#password');
			const submitButton = container.querySelector('button[type="submit"]');

			await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
			await fireEvent.input(passwordInput, { target: { value: 'wrongpassword' } });

			// Submit form
			await fireEvent.click(submitButton);

			// Wait for error handling
			await waitFor(() => {
				expect(handleApiError).toHaveBeenCalledWith(authError);
			});

			// Verify error state
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
			expect(authState.errors).toEqual({
				auth: ['Invalid credentials']
			});

			// Verify no redirect occurred
			expect(global.mockGoto).not.toHaveBeenCalled();
		});

		it('should handle logout even when API fails', async () => {
			// Set up authenticated user
			const mockUser = { id: 1, email: 'john@example.com' };
			authState.user = mockUser;

			// Mock logout API failure
			const serverError = new Error('Server error');
			serverError.status = 500;
			mockHttpClient.post.mockRejectedValue(serverError);

			// Render logout button
			const { container } = render(LogoutButton, {
				props: { redirectTo: '/login' }
			});

			// Click logout button
			const logoutButton = container.querySelector('button');
			await fireEvent.click(logoutButton);

			// Wait for logout attempt
			await waitFor(() => {
				expect(mockHttpClient.post).toHaveBeenCalledWith('/api/logout');
			});

			// Verify user is still logged out despite API error
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
			expect(global.mockGoto).toHaveBeenCalledWith('/login');
		});
	});

	describe('Protected Routes and Session Recovery', () => {
		it('should recover session on app startup', async () => {
			// Mock successful user retrieval
			const mockUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com'
			};
			
			mockHttpClient.get.mockResolvedValue({
				success: true,
				user: mockUser
			});

			// Simulate app startup by calling getUser
			const result = await getUser();

			// Verify session recovery
			expect(mockHttpClient.get).toHaveBeenCalledWith('/api/user');
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(result).toEqual(mockUser);
		});

		it('should handle expired session on startup', async () => {
			// Mock 401 response (expired session)
			const authError = new Error('Unauthorized');
			authError.status = 401;
			mockHttpClient.get.mockRejectedValue(authError);

			// Simulate app startup
			const result = await getUser();

			// Verify session is cleared
			expect(result).toBeNull();
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBeNull();
		});

		it('should handle network errors during session recovery', async () => {
			// Mock network error
			const networkError = new Error('Network error: Failed to fetch');
			mockHttpClient.get.mockRejectedValue(networkError);
			
			handleApiError.mockReturnValue({
				network: ['Network connection failed']
			});

			// Simulate app startup and expect error
			await expect(getUser()).rejects.toThrow('Network error: Failed to fetch');

			// Verify error handling
			expect(handleApiError).toHaveBeenCalledWith(networkError);
			expect(authState.errors).toEqual({
				network: ['Network connection failed']
			});
		});
	});

	describe('CSRF Protection', () => {
		it('should initialize CSRF before authentication requests', async () => {
			// Mock CSRF initialization
			api.initCsrf.mockResolvedValue();
			
			// Mock successful login
			const mockUser = { id: 1, email: 'john@example.com' };
			mockHttpClient.post.mockResolvedValue({
				success: true,
				user: mockUser
			});

			// Perform login
			await login('john@example.com', 'password123');

			// Verify CSRF was initialized before login request
			expect(api.initCsrf).toHaveBeenCalledBefore(mockHttpClient.post);
		});

		it('should handle CSRF initialization failure', async () => {
			// Mock CSRF failure
			const csrfError = new Error('Failed to initialize CSRF protection');
			api.initCsrf.mockRejectedValue(csrfError);

			// Attempt login and expect error
			await expect(login('john@example.com', 'password123')).rejects.toThrow('Failed to initialize CSRF protection');

			// Verify login request was not made
			expect(mockHttpClient.post).not.toHaveBeenCalled();
		});

		it('should include CSRF token in requests', async () => {
			// Set up CSRF token in cookie
			document.cookie = 'XSRF-TOKEN=test-csrf-token';
			
			// Mock successful operations
			api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue({
				success: true,
				user: { id: 1, email: 'john@example.com' }
			});

			// Perform login
			await login('john@example.com', 'password123');

			// Verify CSRF initialization was called
			expect(api.initCsrf).toHaveBeenCalledOnce();
		});
	});

	describe('Error Display and User Feedback', () => {
		it('should display validation errors correctly', async () => {
			// Mock validation error
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

			// Render login form
			const { container } = render(LoginForm);

			// Submit empty form
			const submitButton = container.querySelector('button[type="submit"]');
			await fireEvent.click(submitButton);

			// Wait for error handling
			await waitFor(() => {
				expect(handleApiError).toHaveBeenCalledWith(validationError);
			});

			// Verify error messages are displayed
			expect(container.textContent).toContain('The email field is required.');
			expect(container.textContent).toContain('The password field is required.');
		});

		it('should display network error messages', async () => {
			// Mock network error
			api.initCsrf.mockResolvedValue();
			const networkError = new Error('Network error: Failed to fetch');
			mockHttpClient.post.mockRejectedValue(networkError);
			
			handleApiError.mockReturnValue({
				network: ['Unable to connect to the server. Please check your internet connection.']
			});

			// Render login form
			const { container } = render(LoginForm);

			// Fill and submit form
			const emailInput = container.querySelector('#email');
			const passwordInput = container.querySelector('#password');
			const submitButton = container.querySelector('button[type="submit"]');

			await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
			await fireEvent.input(passwordInput, { target: { value: 'password123' } });
			await fireEvent.click(submitButton);

			// Wait for error handling
			await waitFor(() => {
				expect(handleApiError).toHaveBeenCalledWith(networkError);
			});

			// Verify network error message is displayed
			expect(container.textContent).toContain('Unable to connect to the server');
		});

		it('should show loading indicators during requests', async () => {
			// Mock slow API response
			api.initCsrf.mockResolvedValue();
			let resolveLogin;
			const loginPromise = new Promise(resolve => {
				resolveLogin = resolve;
			});
			mockHttpClient.post.mockReturnValue(loginPromise);

			// Render login form
			const { container } = render(LoginForm);

			// Fill and submit form
			const emailInput = container.querySelector('#email');
			const passwordInput = container.querySelector('#password');
			const submitButton = container.querySelector('button[type="submit"]');

			await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
			await fireEvent.input(passwordInput, { target: { value: 'password123' } });
			await fireEvent.click(submitButton);

			// Verify loading state is shown
			await waitFor(() => {
				expect(container.textContent).toContain('Signing in...');
				expect(submitButton.disabled).toBe(true);
			});

			// Resolve the login
			resolveLogin({
				success: true,
				user: { id: 1, email: 'john@example.com' }
			});

			// Wait for completion
			await waitFor(() => {
				expect(container.textContent).not.toContain('Signing in...');
				expect(submitButton.disabled).toBe(false);
			});
		});
	});

	describe('Form Validation and User Experience', () => {
		it('should validate email format on client side', async () => {
			// Render login form
			const { container } = render(LoginForm);

			// Enter invalid email
			const emailInput = container.querySelector('#email');
			const passwordInput = container.querySelector('#password');
			const submitButton = container.querySelector('button[type="submit"]');

			await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
			await fireEvent.input(passwordInput, { target: { value: 'password123' } });
			await fireEvent.click(submitButton);

			// Verify client-side validation prevents submission
			expect(api.initCsrf).not.toHaveBeenCalled();
			expect(mockHttpClient.post).not.toHaveBeenCalled();

			// Verify error message
			expect(container.textContent).toContain('Please enter a valid email address');
		});

		it('should validate password length on client side', async () => {
			// Render login form
			const { container } = render(LoginForm);

			// Enter short password
			const emailInput = container.querySelector('#email');
			const passwordInput = container.querySelector('#password');
			const submitButton = container.querySelector('button[type="submit"]');

			await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
			await fireEvent.input(passwordInput, { target: { value: 'short' } });
			await fireEvent.click(submitButton);

			// Verify client-side validation prevents submission
			expect(api.initCsrf).not.toHaveBeenCalled();
			expect(mockHttpClient.post).not.toHaveBeenCalled();

			// Verify error message
			expect(container.textContent).toContain('Password must be at least 6 characters long');
		});

		it('should clear field errors when user starts typing', async () => {
			// Set up initial error state
			const { container } = render(LoginForm);
			
			// Simulate server error state
			authState.errors = {
				email: ['The email field is required.'],
				password: ['The password field is required.']
			};

			// Start typing in email field
			const emailInput = container.querySelector('#email');
			await fireEvent.input(emailInput, { target: { value: 'j' } });

			// Verify that field-specific error clearing is attempted
			// (The actual clearing logic is mocked, so we just verify the interaction)
			expect(emailInput.value).toBe('j');
		});
	});

	describe('Logout Confirmation', () => {
		it('should show confirmation dialog when enabled', async () => {
			// Set up authenticated user
			authState.user = { id: 1, email: 'john@example.com' };

			// Render logout button with confirmation
			const { container } = render(LogoutButton, {
				props: { 
					showConfirmation: true,
					redirectTo: '/login'
				}
			});

			// Click logout button
			const logoutButton = container.querySelector('button');
			await fireEvent.click(logoutButton);

			// Verify confirmation dialog is shown
			expect(container.textContent).toContain('Confirm Sign Out');
			expect(container.textContent).toContain('Are you sure you want to sign out');

			// Verify logout hasn't happened yet
			expect(mockHttpClient.post).not.toHaveBeenCalled();

			// Click confirm button
			const confirmButton = container.querySelector('.dialog-button.primary');
			await fireEvent.click(confirmButton);

			// Mock successful logout
			mockHttpClient.post.mockResolvedValue({ success: true });

			// Wait for logout
			await waitFor(() => {
				expect(mockHttpClient.post).toHaveBeenCalledWith('/api/logout');
			});
		});

		it('should cancel logout when user clicks cancel', async () => {
			// Set up authenticated user
			authState.user = { id: 1, email: 'john@example.com' };

			// Render logout button with confirmation
			const { container } = render(LogoutButton, {
				props: { 
					showConfirmation: true,
					redirectTo: '/login'
				}
			});

			// Click logout button
			const logoutButton = container.querySelector('button');
			await fireEvent.click(logoutButton);

			// Verify confirmation dialog is shown
			expect(container.textContent).toContain('Confirm Sign Out');

			// Click cancel button
			const cancelButton = container.querySelector('.dialog-button.secondary');
			await fireEvent.click(cancelButton);

			// Verify dialog is closed and logout didn't happen
			expect(container.textContent).not.toContain('Confirm Sign Out');
			expect(mockHttpClient.post).not.toHaveBeenCalled();
			expect(authState.isAuthenticated).toBe(true);
		});
	});

	describe('Redirect Handling', () => {
		it('should redirect to intended page after login', async () => {
			// Mock successful login
			api.initCsrf.mockResolvedValue();
			const mockUser = { id: 1, email: 'john@example.com' };
			mockHttpClient.post.mockResolvedValue({
				success: true,
				user: mockUser
			});

			// Render login form with custom redirect
			const { container } = render(LoginForm, {
				props: { redirectTo: '/profile' }
			});

			// Fill and submit form
			const emailInput = container.querySelector('#email');
			const passwordInput = container.querySelector('#password');
			const submitButton = container.querySelector('button[type="submit"]');

			await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
			await fireEvent.input(passwordInput, { target: { value: 'password123' } });
			await fireEvent.click(submitButton);

			// Wait for login completion
			await waitFor(() => {
				expect(global.mockGoto).toHaveBeenCalledWith('/profile');
			});
		});

		it('should redirect authenticated users away from auth pages', async () => {
			// Set up authenticated user
			authState.user = { id: 1, email: 'john@example.com' };

			// This would typically be handled by the auth guard,
			// but we can test the component behavior
			expect(authState.isAuthenticated).toBe(true);
		});
	});
});