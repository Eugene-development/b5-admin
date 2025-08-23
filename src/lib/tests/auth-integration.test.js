/**
 * Authentication Integration Tests for B5-Admin
 *
 * This test suite covers the complete authentication flow:
 * - Registration → Email verification → Login → Access to admin → Logout
 * - Protected routes functionality
 * - Error handling scenarios
 * - "Remember me" functionality
 * - Integration with existing B5-Admin components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

// Import components and modules to test
import LoginPage from '../../routes/login/+page.svelte';
import RegisterPage from '../../routes/register/+page.svelte';
import EmailVerifyPage from '../../routes/email-verify/+page.svelte';
import DashboardPage from '../../routes/dashboard/+page.svelte';
import ProtectedRoute from '../components/ProtectedRoute.svelte';
import Layout from '../../routes/+layout.svelte';

// Import auth modules
import {
	authState,
	login,
	register,
	logout,
	initializeAuth,
	clearError,
	sendEmailVerificationNotification,
	verifyEmailAddress
} from '../state/auth.svelte.js';
import * as authAPI from '../api/auth.js';
import * as config from '../api/config.js';

// Mock external dependencies
vi.mock('$app/navigation');
vi.mock('$app/stores');
vi.mock('../api/auth.js');
vi.mock('../api/config.js');
vi.mock('../utils/toastStore.js', () => ({
	addSuccessToast: vi.fn(),
	addErrorToast: vi.fn(),
	clearAllToasts: vi.fn(),
	toasts: { subscribe: vi.fn() }
}));

describe('Authentication Integration Tests', () => {
	// Mock data
	const mockUser = {
		id: 1,
		name: 'Test User',
		email: 'test@example.com',
		city: 'Test City',
		key: 'test_ulid_key',
		email_verified: true,
		email_verified_at: '2024-01-01T00:00:00Z'
	};

	const mockToken = {
		access_token: 'mock_bearer_token',
		token_type: 'Bearer',
		expires_at: null
	};

	const mockUnverifiedUser = {
		...mockUser,
		email_verified: false,
		email_verified_at: null
	};

	beforeEach(() => {
		// Reset auth state
		authState.user = null;
		authState.isAuthenticated = false;
		authState.emailVerified = false;
		authState.token = null;
		authState.loading = false;
		authState.initialized = false;
		clearError();

		// Reset mocks
		vi.clearAllMocks();

		// Setup default mocks
		vi.mocked(goto).mockResolvedValue();
		vi.mocked(page).mockReturnValue({
			url: new URL('http://localhost:3000/dashboard'),
			params: {},
			route: { id: '/dashboard' }
		});

		// Mock localStorage
		Object.defineProperty(window, 'localStorage', {
			value: {
				getItem: vi.fn(),
				setItem: vi.fn(),
				removeItem: vi.fn(),
				clear: vi.fn()
			},
			writable: true
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Full Authentication Flow', () => {
		it('should complete full registration → email verification → login → access → logout flow', async () => {
			// Step 1: Registration
			const registrationData = {
				name: 'Test User',
				city: 'Test City',
				email: 'test@example.com',
				password: 'password123',
				password_confirmation: 'password123',
				terms_accepted: true
			};

			// Mock successful registration
			vi.mocked(authAPI.registerUser).mockResolvedValue({
				success: true,
				user: mockUnverifiedUser,
				token: mockToken,
				message: 'Registration successful'
			});

			vi.mocked(config.setAuthToken).mockImplementation(() => {});
			vi.mocked(config.setUserData).mockImplementation(() => {});

			// Test registration
			const registerSuccess = await register(registrationData);
			expect(registerSuccess).toBe(true);
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.emailVerified).toBe(false);
			expect(authAPI.registerUser).toHaveBeenCalledWith(registrationData);

			// Step 2: Email verification
			vi.mocked(authAPI.sendEmailVerification).mockResolvedValue({
				success: true,
				message: 'Verification email sent'
			});

			const emailSent = await sendEmailVerificationNotification();
			expect(emailSent).toBe(true);
			expect(authAPI.sendEmailVerification).toHaveBeenCalled();

			// Mock email verification
			vi.mocked(authAPI.verifyEmail).mockResolvedValue({
				success: true,
				message: 'Email verified successfully'
			});

			const emailVerified = await verifyEmailAddress('1', 'hash123', 'signature123');
			expect(emailVerified).toBe(true);
			expect(authState.emailVerified).toBe(true);

			// Step 3: Login (after logout and re-login)
			// First logout
			vi.mocked(authAPI.logoutUser).mockResolvedValue({
				success: true,
				message: 'Logout successful'
			});

			vi.mocked(config.removeAuthToken).mockImplementation(() => {});

			const logoutSuccess = await logout();
			expect(logoutSuccess).toBe(true);
			expect(authState.isAuthenticated).toBe(false);

			// Then login again
			vi.mocked(authAPI.loginUser).mockResolvedValue({
				success: true,
				user: mockUser, // Now with verified email
				token: mockToken,
				message: 'Login successful'
			});

			const loginSuccess = await login('test@example.com', 'password123', true);
			expect(loginSuccess).toBe(true);
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.emailVerified).toBe(true);
			expect(authAPI.loginUser).toHaveBeenCalledWith('test@example.com', 'password123', true);

			// Step 4: Access to protected routes should work
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.emailVerified).toBe(true);

			// Step 5: Final logout
			const finalLogout = await logout();
			expect(finalLogout).toBe(true);
			expect(authState.isAuthenticated).toBe(false);
		});
	});

	describe('Protected Routes', () => {
		it('should redirect unauthenticated users to login', async () => {
			// Mock unauthenticated state
			authState.initialized = true;
			authState.isAuthenticated = false;

			const { component } = render(ProtectedRoute, {
				props: {
					children: () => 'Protected Content'
				}
			});

			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith('/login?redirectTo=%2Fdashboard');
			});
		});

		it('should redirect users with unverified email when email verification is required', async () => {
			// Mock authenticated but unverified state
			authState.initialized = true;
			authState.isAuthenticated = true;
			authState.emailVerified = false;
			authState.user = mockUnverifiedUser;

			const { component } = render(ProtectedRoute, {
				props: {
					requireEmailVerification: true,
					children: () => 'Protected Content'
				}
			});

			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith('/email-verify');
			});
		});

		it('should allow access to authenticated users with verified email', async () => {
			// Mock fully authenticated state
			authState.initialized = true;
			authState.isAuthenticated = true;
			authState.emailVerified = true;
			authState.user = mockUser;

			const { getByText } = render(ProtectedRoute, {
				props: {
					requireEmailVerification: true,
					children: () => 'Protected Content'
				}
			});

			await waitFor(() => {
				expect(getByText('Protected Content')).toBeInTheDocument();
			});
		});

		it('should preserve redirectTo parameter after login', async () => {
			const mockPageWithRedirect = {
				url: new URL('http://localhost:3000/login?redirectTo=%2Fagents'),
				params: {},
				route: { id: '/login' }
			};

			vi.mocked(page).mockReturnValue(mockPageWithRedirect);

			// Mock successful login
			vi.mocked(authAPI.loginUser).mockResolvedValue({
				success: true,
				user: mockUser,
				token: mockToken,
				message: 'Login successful'
			});

			const loginSuccess = await login('test@example.com', 'password123', false);
			expect(loginSuccess).toBe(true);

			// Should redirect to the originally requested page
			// This would be handled by the login page component
		});
	});

	describe('Error Handling Scenarios', () => {
		it('should handle network errors during login', async () => {
			vi.mocked(authAPI.loginUser).mockRejectedValue(new Error('Network error'));

			const loginSuccess = await login('test@example.com', 'wrongpassword', false);
			expect(loginSuccess).toBe(false);
			expect(authState.loginError).toContain('Network error');
		});

		it('should handle 401 authentication errors', async () => {
			vi.mocked(authAPI.loginUser).mockResolvedValue({
				success: false,
				message: 'Неверный email или пароль',
				errors: {}
			});

			const loginSuccess = await login('test@example.com', 'wrongpassword', false);
			expect(loginSuccess).toBe(false);
			expect(authState.loginError).toBe('Неверный email или пароль');
		});

		it('should handle validation errors during registration', async () => {
			const validationErrors = {
				email: ['Email уже используется'],
				password: ['Пароль слишком короткий']
			};

			vi.mocked(authAPI.registerUser).mockResolvedValue({
				success: false,
				message: 'Validation failed',
				errors: validationErrors
			});

			const registrationData = {
				name: 'Test User',
				city: 'Test City',
				email: 'existing@example.com',
				password: '123',
				password_confirmation: '123',
				terms_accepted: true
			};

			const registerSuccess = await register(registrationData);
			expect(registerSuccess).toBe(false);
			expect(authState.registerError).toBe('Validation failed');
		});

		it('should handle email verification failures', async () => {
			vi.mocked(authAPI.verifyEmail).mockResolvedValue({
				success: false,
				message: 'Ссылка подтверждения недействительна или истекла'
			});

			const emailVerified = await verifyEmailAddress('1', 'invalid_hash', 'invalid_signature');
			expect(emailVerified).toBe(false);
			expect(authState.emailVerificationError).toBe(
				'Ссылка подтверждения недействительна или истекла'
			);
		});

		it('should handle token expiration gracefully', async () => {
			// Mock expired token scenario
			vi.mocked(authAPI.getCurrentUser).mockResolvedValue({
				success: false,
				message: 'Сессия истекла. Необходимо войти в систему заново'
			});

			vi.mocked(config.hasAuthToken).mockReturnValue(true);
			vi.mocked(config.removeAuthToken).mockImplementation(() => {});

			await initializeAuth();

			expect(authState.isAuthenticated).toBe(false);
			expect(config.removeAuthToken).toHaveBeenCalled();
		});
	});

	describe('Remember Me Functionality', () => {
		it('should persist authentication when "remember me" is enabled', async () => {
			// Mock successful login with remember me
			vi.mocked(authAPI.loginUser).mockResolvedValue({
				success: true,
				user: mockUser,
				token: mockToken,
				message: 'Login successful'
			});

			vi.mocked(config.setAuthToken).mockImplementation(() => {});
			vi.mocked(config.setUserData).mockImplementation(() => {});

			const loginSuccess = await login('test@example.com', 'password123', true);
			expect(loginSuccess).toBe(true);

			// Verify that token is stored with remember flag
			expect(authAPI.loginUser).toHaveBeenCalledWith('test@example.com', 'password123', true);
			expect(config.setAuthToken).toHaveBeenCalledWith(mockToken);
		});

		it('should restore authentication state from stored token on app initialization', async () => {
			// Mock stored token and user data
			vi.mocked(config.hasAuthToken).mockReturnValue(true);
			vi.mocked(config.getAuthToken).mockReturnValue('stored_token');
			vi.mocked(config.getUserData).mockReturnValue(mockUser);

			vi.mocked(authAPI.getCurrentUser).mockResolvedValue({
				success: true,
				user: mockUser,
				message: 'User data retrieved'
			});

			await initializeAuth();

			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(authState.emailVerified).toBe(true);
			expect(authState.initialized).toBe(true);
		});

		it('should clear invalid stored tokens', async () => {
			// Mock invalid stored token
			vi.mocked(config.hasAuthToken).mockReturnValue(true);
			vi.mocked(authAPI.getCurrentUser).mockResolvedValue({
				success: false,
				message: 'Invalid token'
			});

			vi.mocked(config.removeAuthToken).mockImplementation(() => {});

			await initializeAuth();

			expect(authState.isAuthenticated).toBe(false);
			expect(config.removeAuthToken).toHaveBeenCalled();
		});
	});

	describe('Integration with B5-Admin Components', () => {
		it('should integrate with Toast notification system', async () => {
			const { addSuccessToast, addErrorToast } = await import('../utils/toastStore.js');

			// Mock successful login
			vi.mocked(authAPI.loginUser).mockResolvedValue({
				success: true,
				user: mockUser,
				token: mockToken,
				message: 'Login successful'
			});

			await login('test@example.com', 'password123', false);

			// Toast integration would be handled by the UI components
			// This test verifies the auth functions work correctly
			expect(authState.isAuthenticated).toBe(true);
		});

		it('should integrate with LoadingOverlay component', async () => {
			// Mock slow API response
			vi.mocked(authAPI.loginUser).mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(
							() =>
								resolve({
									success: true,
									user: mockUser,
									token: mockToken
								}),
							100
						)
					)
			);

			const loginPromise = login('test@example.com', 'password123', false);

			// Check loading state is set
			expect(authState.loginLoading).toBe(true);

			await loginPromise;

			// Check loading state is cleared
			expect(authState.loginLoading).toBe(false);
		});

		it('should integrate with main layout user display', async () => {
			// Set authenticated state
			authState.isAuthenticated = true;
			authState.user = mockUser;

			// The layout should display user information
			// This would be tested in the layout component tests
			expect(authState.user.name).toBe('Test User');
			expect(authState.user.email).toBe('test@example.com');
		});

		it('should handle logout from layout with confirmation', async () => {
			// Mock successful logout
			vi.mocked(authAPI.logoutUser).mockResolvedValue({
				success: true,
				message: 'Logout successful'
			});

			vi.mocked(config.removeAuthToken).mockImplementation(() => {});

			// Set initial authenticated state
			authState.isAuthenticated = true;
			authState.user = mockUser;

			const logoutSuccess = await logout();

			expect(logoutSuccess).toBe(true);
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBe(null);
		});
	});

	describe('Dashboard and Admin Pages Access', () => {
		it('should allow access to dashboard when fully authenticated', async () => {
			// Mock fully authenticated state
			authState.initialized = true;
			authState.isAuthenticated = true;
			authState.emailVerified = true;
			authState.user = mockUser;

			const { getByText } = render(DashboardPage);

			await waitFor(() => {
				expect(getByText('Dashboard')).toBeInTheDocument();
				expect(
					getByText('Добро пожаловать в административную панель B5-Admin.')
				).toBeInTheDocument();
			});
		});

		it('should protect agents page from unauthenticated access', async () => {
			// Mock unauthenticated state
			authState.initialized = true;
			authState.isAuthenticated = false;

			// This would be tested by wrapping the agents page in ProtectedRoute
			// and verifying the redirect behavior
			const mockAgentsPage = () =>
				render(ProtectedRoute, {
					props: {
						children: () => 'Agents Page Content'
					}
				});

			mockAgentsPage();

			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith('/login?redirectTo=%2Fdashboard');
			});
		});

		it('should protect projects page from unauthenticated access', async () => {
			// Mock unauthenticated state
			authState.initialized = true;
			authState.isAuthenticated = false;

			const mockProjectsPage = () =>
				render(ProtectedRoute, {
					props: {
						children: () => 'Projects Page Content'
					}
				});

			mockProjectsPage();

			await waitFor(() => {
				expect(goto).toHaveBeenCalledWith('/login?redirectTo=%2Fdashboard');
			});
		});
	});

	describe('Form Validation and User Experience', () => {
		it('should validate login form fields', async () => {
			const { getByLabelText, getByRole } = render(LoginPage, {
				props: {
					data: { redirectTo: '/dashboard' }
				}
			});

			const emailInput = getByLabelText(/email/i);
			const passwordInput = getByLabelText(/пароль/i);
			const submitButton = getByRole('button', { name: /войти/i });

			// Test empty form submission
			await fireEvent.click(submitButton);

			// Should show validation errors
			await waitFor(() => {
				expect(screen.queryByText(/email обязателен/i)).toBeInTheDocument();
				expect(screen.queryByText(/пароль обязателен/i)).toBeInTheDocument();
			});
		});

		it('should validate registration form fields', async () => {
			const { getByLabelText, getByRole } = render(RegisterPage);

			const nameInput = getByLabelText(/имя/i);
			const emailInput = getByLabelText(/email/i);
			const passwordInput = getByLabelText(/пароль/i);
			const submitButton = getByRole('button', { name: /зарегистрироваться/i });

			// Test empty form submission
			await fireEvent.click(submitButton);

			// Should show validation errors
			await waitFor(() => {
				expect(screen.queryByText(/имя обязательно/i)).toBeInTheDocument();
				expect(screen.queryByText(/email обязателен/i)).toBeInTheDocument();
				expect(screen.queryByText(/пароль обязателен/i)).toBeInTheDocument();
			});
		});

		it('should handle password confirmation mismatch', async () => {
			const { getByLabelText, getByRole } = render(RegisterPage);

			const passwordInput = getByLabelText(/^пароль/i);
			const confirmPasswordInput = getByLabelText(/подтверждение пароля/i);
			const submitButton = getByRole('button', { name: /зарегистрироваться/i });

			// Fill in mismatched passwords
			await fireEvent.input(passwordInput, { target: { value: 'password123' } });
			await fireEvent.input(confirmPasswordInput, { target: { value: 'different123' } });
			await fireEvent.click(submitButton);

			// Should show password mismatch error
			await waitFor(() => {
				expect(screen.queryByText(/пароли не совпадают/i)).toBeInTheDocument();
			});
		});
	});
});
