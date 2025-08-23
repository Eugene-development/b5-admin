/**
 * Core Authentication Logic Tests for B5-Admin
 * 
 * Tests the core authentication functionality without SvelteKit dependencies:
 * - Auth state management
 * - API integration
 * - Token management
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import auth modules
import { 
	authState, 
	login, 
	register, 
	logout, 
	initializeAuth,
	clearError,
	sendEmailVerificationNotification,
	verifyEmailAddress,
	markEmailAsVerified
} from '../state/auth.svelte.js';

// Mock the API modules

vi.mock('../api/config.js', () => ({
	getAuthToken: vi.fn(),
	setAuthToken: vi.fn(),
	removeAuthToken: vi.fn(),
	getUserData: vi.fn(),
	setUserData: vi.fn(),
	hasAuthToken: vi.fn()
}));

// Mock getCurrentUser from auth.js for initialization tests
vi.mock('../api/auth.js', () => ({
	loginUser: vi.fn(),
	registerUser: vi.fn(),
	logoutUser: vi.fn(),
	getCurrentUser: vi.fn(),
	sendEmailVerification: vi.fn(),
	resendEmailVerification: vi.fn(),
	verifyEmail: vi.fn()
}));

describe('Core Authentication Logic', () => {
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

	beforeEach(async () => {
		// Reset auth state
		authState.user = null;
		authState.isAuthenticated = false;
		authState.emailVerified = false;
		authState.token = null;
		authState.loading = false;
		authState.loginLoading = false;
		authState.registerLoading = false;
		authState.logoutLoading = false;
		authState.emailVerificationLoading = false;
		authState.error = null;
		authState.loginError = null;
		authState.registerError = null;
		authState.emailVerificationError = null;
		authState.initialized = false;

		// Clear all mocks
		vi.clearAllMocks();
	});

	describe('Login Functionality', () => {
		it('should successfully login with valid credentials', async () => {
			const { loginUser } = await import('../api/auth.js');
			const { setAuthToken, setUserData } = await import('../api/config.js');

			// Mock successful login
			vi.mocked(loginUser).mockResolvedValue({
				success: true,
				user: mockUser,
				token: mockToken,
				message: 'Login successful'
			});

			const result = await login('test@example.com', 'password123', false);

			expect(result).toBe(true);
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(authState.emailVerified).toBe(true);
			expect(authState.token).toBe(mockToken.access_token);
			expect(loginUser).toHaveBeenCalledWith('test@example.com', 'password123', false);
			expect(setAuthToken).toHaveBeenCalledWith(mockToken);
			expect(setUserData).toHaveBeenCalledWith(mockUser);
		});

		it('should handle login failure with invalid credentials', async () => {
			const { loginUser } = await import('../api/auth.js');

			// Mock failed login
			vi.mocked(loginUser).mockResolvedValue({
				success: false,
				message: 'Неверный email или пароль',
				errors: {}
			});

			const result = await login('test@example.com', 'wrongpassword', false);

			expect(result).toBe(false);
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.loginError).toBe('Неверный email или пароль');
			expect(authState.user).toBe(null);
		});

		it('should handle remember me functionality', async () => {
			const { loginUser } = await import('../api/auth.js');
			const { setAuthToken, setUserData } = await import('../api/config.js');

			// Mock successful login with remember me
			vi.mocked(loginUser).mockResolvedValue({
				success: true,
				user: mockUser,
				token: mockToken,
				message: 'Login successful'
			});

			const result = await login('test@example.com', 'password123', true);

			expect(result).toBe(true);
			expect(loginUser).toHaveBeenCalledWith('test@example.com', 'password123', true);
			expect(setAuthToken).toHaveBeenCalledWith(mockToken);
		});

		it('should handle network errors during login', async () => {
			const { loginUser } = await import('../api/auth.js');

			// Mock network error
			vi.mocked(loginUser).mockRejectedValue(new Error('Network error'));

			const result = await login('test@example.com', 'password123', false);

			expect(result).toBe(false);
			expect(authState.loginError).toContain('Network error');
		});
	});

	describe('Registration Functionality', () => {
		it('should successfully register a new user', async () => {
			const { registerUser } = await import('../api/auth.js');
			const { setAuthToken, setUserData } = await import('../api/config.js');

			const registrationData = {
				name: 'Test User',
				city: 'Test City',
				email: 'test@example.com',
				password: 'password123',
				password_confirmation: 'password123',
				terms_accepted: true
			};

			// Mock successful registration
			vi.mocked(registerUser).mockResolvedValue({
				success: true,
				user: mockUnverifiedUser,
				token: mockToken,
				message: 'Registration successful'
			});

			const result = await register(registrationData);

			expect(result).toBe(true);
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUnverifiedUser);
			expect(authState.emailVerified).toBe(false);
			expect(registerUser).toHaveBeenCalledWith(registrationData);
			expect(setAuthToken).toHaveBeenCalledWith(mockToken);
			expect(setUserData).toHaveBeenCalledWith(mockUnverifiedUser);
		});

		it('should handle registration failure', async () => {
			const { registerUser } = await import('../api/auth.js');

			const registrationData = {
				name: 'Test User',
				city: 'Test City',
				email: 'existing@example.com',
				password: 'password123',
				password_confirmation: 'password123',
				terms_accepted: true
			};

			// Mock failed registration
			vi.mocked(registerUser).mockResolvedValue({
				success: false,
				message: 'Пользователь с таким email уже существует',
				errors: { email: ['Email уже используется'] }
			});

			const result = await register(registrationData);

			expect(result).toBe(false);
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.registerError).toBe('Пользователь с таким email уже существует');
		});
	});

	describe('Logout Functionality', () => {
		it('should successfully logout user', async () => {
			const { logoutUser } = await import('../api/auth.js');
			const { removeAuthToken } = await import('../api/config.js');

			// Set initial authenticated state
			authState.isAuthenticated = true;
			authState.user = mockUser;
			authState.token = 'some_token';

			// Mock successful logout
			vi.mocked(logoutUser).mockResolvedValue({
				success: true,
				message: 'Logout successful'
			});

			const result = await logout();

			expect(result).toBe(true);
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBe(null);
			expect(authState.token).toBe(null);
			expect(removeAuthToken).toHaveBeenCalled();
		});

		it('should clear local state even if API logout fails', async () => {
			const { logoutUser } = await import('../api/auth.js');
			const { removeAuthToken } = await import('../api/config.js');

			// Set initial authenticated state
			authState.isAuthenticated = true;
			authState.user = mockUser;
			authState.token = 'some_token';

			// Mock failed logout API call
			vi.mocked(logoutUser).mockRejectedValue(new Error('Server error'));

			const result = await logout();

			// Should still clear local state
			expect(result).toBe(true);
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBe(null);
			expect(removeAuthToken).toHaveBeenCalled();
		});
	});

	describe('Email Verification', () => {
		it('should send email verification notification', async () => {
			const { sendEmailVerification } = await import('../api/auth.js');

			// Mock successful email verification send
			vi.mocked(sendEmailVerification).mockResolvedValue({
				success: true,
				message: 'Verification email sent'
			});

			const result = await sendEmailVerificationNotification();

			expect(result).toBe(true);
			expect(sendEmailVerification).toHaveBeenCalled();
		});

		it('should verify email address', async () => {
			const { verifyEmail } = await import('../api/auth.js');

			// Set initial state with unverified user
			authState.user = mockUnverifiedUser;
			authState.isAuthenticated = true;
			authState.emailVerified = false;

			// Mock successful email verification
			vi.mocked(verifyEmail).mockResolvedValue({
				success: true,
				message: 'Email verified successfully'
			});

			const result = await verifyEmailAddress('1', 'hash123', 'signature123');

			expect(result).toBe(true);
			expect(verifyEmail).toHaveBeenCalledWith('1', 'hash123', 'signature123');
			expect(authState.emailVerified).toBe(true);
		});

		it('should handle email verification failure', async () => {
			const { verifyEmail } = await import('../api/auth.js');

			// Mock failed email verification
			vi.mocked(verifyEmail).mockResolvedValue({
				success: false,
				message: 'Ссылка подтверждения недействительна или истекла'
			});

			const result = await verifyEmailAddress('1', 'invalid_hash', 'invalid_signature');

			expect(result).toBe(false);
			expect(authState.emailVerificationError).toBe('Ссылка подтверждения недействительна или истекла');
		});

		it('should mark email as verified', () => {
			// Set initial state with unverified user
			authState.user = mockUnverifiedUser;
			authState.emailVerified = false;

			markEmailAsVerified();

			expect(authState.user.email_verified).toBe(true);
			expect(authState.emailVerified).toBe(true);
			expect(authState.user.email_verified_at).toBeTruthy();
		});
	});

	describe('Authentication Initialization', () => {
		it('should initialize auth state with valid stored token', async () => {
			const { hasAuthToken, getAuthToken } = await import('../api/config.js');
			const { getCurrentUser } = await import('../api/auth.js');

			// Mock stored token
			vi.mocked(hasAuthToken).mockReturnValue(true);
			vi.mocked(getAuthToken).mockReturnValue('stored_token');
			vi.mocked(getCurrentUser).mockResolvedValue({
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

		it('should clear invalid stored token', async () => {
			const { hasAuthToken, removeAuthToken } = await import('../api/config.js');
			const { getCurrentUser } = await import('../api/auth.js');

			// Mock invalid stored token
			vi.mocked(hasAuthToken).mockReturnValue(true);
			vi.mocked(getCurrentUser).mockResolvedValue({
				success: false,
				message: 'Invalid token'
			});

			await initializeAuth();

			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBe(null);
			expect(removeAuthToken).toHaveBeenCalled();
			expect(authState.initialized).toBe(true);
		});

		it('should handle no stored token', async () => {
			const { hasAuthToken } = await import('../api/config.js');

			// Mock no stored token
			vi.mocked(hasAuthToken).mockReturnValue(false);

			await initializeAuth();

			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBe(null);
			expect(authState.initialized).toBe(true);
		});
	});

	describe('Error Handling', () => {
		it('should clear all errors', () => {
			// Set some errors
			authState.error = 'General error';
			authState.loginError = 'Login error';
			authState.registerError = 'Register error';
			authState.emailVerificationError = 'Email error';

			clearError();

			expect(authState.error).toBe(null);
			expect(authState.loginError).toBe(null);
			expect(authState.registerError).toBe(null);
			expect(authState.emailVerificationError).toBe(null);
		});

		it('should handle loading states correctly', async () => {
			const { loginUser } = await import('../api/auth.js');

			// Mock slow login
			vi.mocked(loginUser).mockImplementation(() => 
				new Promise(resolve => setTimeout(() => resolve({
					success: true,
					user: mockUser,
					token: mockToken
				}), 100))
			);

			const loginPromise = login('test@example.com', 'password123', false);

			// Check loading state is set
			expect(authState.loginLoading).toBe(true);

			await loginPromise;

			// Check loading state is cleared
			expect(authState.loginLoading).toBe(false);
		});
	});

	describe('State Management', () => {
		it('should maintain consistent state during operations', async () => {
			const { loginUser } = await import('../api/auth.js');
			const { setAuthToken, setUserData } = await import('../api/config.js');

			// Mock successful login
			vi.mocked(loginUser).mockResolvedValue({
				success: true,
				user: mockUser,
				token: mockToken,
				message: 'Login successful'
			});

			// Verify initial state
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.user).toBe(null);

			// Perform login
			await login('test@example.com', 'password123', false);

			// Verify final state
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(authState.emailVerified).toBe(mockUser.email_verified);
			expect(authState.token).toBe(mockToken.access_token);
		});

		it('should handle partial user data correctly', async () => {
			const { loginUser } = await import('../api/auth.js');

			const partialUser = {
				id: 1,
				name: 'Test User',
				email: 'test@example.com'
				// Missing city, key, email_verified fields
			};

			// Mock login with partial user data
			vi.mocked(loginUser).mockResolvedValue({
				success: true,
				user: partialUser,
				token: mockToken,
				message: 'Login successful'
			});

			await login('test@example.com', 'password123', false);

			expect(authState.isAuthenticated).toBe(true);
			expect(authState.user).toEqual(partialUser);
			expect(authState.emailVerified).toBe(false); // Should default to false
		});
	});
});