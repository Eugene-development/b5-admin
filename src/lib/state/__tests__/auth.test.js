/**
 * Tests for Authentication State Store
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	authState,
	initializeAuth,
	login,
	register,
	logout,
	checkAuth,
	sendEmailVerificationNotification,
	resendEmailVerificationNotification,
	markEmailAsVerified,
	clearError,
	isAuthenticated,
	getCurrentUserData,
	isEmailVerified,
	isLoading,
	getError
} from '../auth.svelte.js';

// Mock the API functions
vi.mock('../../api/auth.js', () => ({
	loginUser: vi.fn(),
	registerUser: vi.fn(),
	logoutUser: vi.fn(),
	getCurrentUser: vi.fn(),
	sendEmailVerification: vi.fn(),
	resendEmailVerification: vi.fn()
}));

// Mock the config functions
vi.mock('../../api/config.js', () => ({
	getAuthToken: vi.fn(),
	setAuthToken: vi.fn(),
	removeAuthToken: vi.fn(),
	getUserData: vi.fn(),
	setUserData: vi.fn(),
	hasAuthToken: vi.fn()
}));

// Import mocked functions
import {
	loginUser,
	registerUser,
	logoutUser,
	getCurrentUser,
	sendEmailVerification,
	resendEmailVerification
} from '../../api/auth.js';

import {
	getAuthToken,
	setAuthToken,
	removeAuthToken,
	getUserData,
	setUserData,
	hasAuthToken
} from '../../api/config.js';

describe('Auth Store', () => {
	const mockUser = {
		id: 1,
		name: 'Test User',
		email: 'test@example.com',
		city: 'Test City',
		key: 'test-ulid-key',
		email_verified: true,
		email_verified_at: '2024-01-01T00:00:00Z'
	};

	const mockToken = {
		access_token: 'test-bearer-token',
		token_type: 'Bearer',
		expires_at: null
	};

	beforeEach(() => {
		vi.clearAllMocks();
		
		// Reset auth state
		authState.user = null;
		authState.isAuthenticated = false;
		authState.emailVerified = false;
		authState.loading = false;
		authState.loginLoading = false;
		authState.registerLoading = false;
		authState.logoutLoading = false;
		authState.emailVerificationLoading = false;
		authState.error = null;
		authState.loginError = null;
		authState.registerError = null;
		authState.emailVerificationError = null;
		authState.token = null;
		authState.initialized = false;
	});

	describe('initializeAuth', () => {
		it('should initialize auth state when token exists and is valid', async () => {
			hasAuthToken.mockReturnValue(true);
			getCurrentUser.mockResolvedValue({
				success: true,
				user: mockUser
			});
			getAuthToken.mockReturnValue('test-token');

			await initializeAuth();

			expect(authState.user).toEqual(mockUser);
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.emailVerified).toBe(true);
			expect(authState.token).toBe('test-token');
			expect(authState.initialized).toBe(true);
			expect(setUserData).toHaveBeenCalledWith(mockUser);
		});

		it('should clear state when token is invalid', async () => {
			hasAuthToken.mockReturnValue(true);
			getCurrentUser.mockResolvedValue({
				success: false,
				message: 'Invalid token'
			});

			await initializeAuth();

			expect(authState.user).toBeNull();
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.initialized).toBe(true);
			expect(removeAuthToken).toHaveBeenCalled();
		});

		it('should clear state when no token exists', async () => {
			hasAuthToken.mockReturnValue(false);

			await initializeAuth();

			expect(authState.user).toBeNull();
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.initialized).toBe(true);
		});
	});

	describe('login', () => {
		it('should login successfully', async () => {
			loginUser.mockResolvedValue({
				success: true,
				user: mockUser,
				token: mockToken,
				message: 'Login successful'
			});

			const result = await login('test@example.com', 'password', false);

			expect(result).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.emailVerified).toBe(true);
			expect(authState.token).toBe(mockToken.access_token);
			expect(authState.loginError).toBeNull();
			expect(setAuthToken).toHaveBeenCalledWith(mockToken);
			expect(setUserData).toHaveBeenCalledWith(mockUser);
		});

		it('should handle login failure', async () => {
			loginUser.mockResolvedValue({
				success: false,
				message: 'Invalid credentials'
			});

			const result = await login('test@example.com', 'wrong-password', false);

			expect(result).toBe(false);
			expect(authState.user).toBeNull();
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.loginError).toBe('Invalid credentials');
			expect(authState.error).toBe('Invalid credentials');
		});

		it('should handle login error', async () => {
			loginUser.mockRejectedValue(new Error('Network error'));

			const result = await login('test@example.com', 'password', false);

			expect(result).toBe(false);
			expect(authState.loginError).toBe('Network error');
		});
	});

	describe('register', () => {
		const userData = {
			name: 'Test User',
			email: 'test@example.com',
			password: 'password123',
			password_confirmation: 'password123',
			city: 'Test City',
			terms_accepted: true
		};

		it('should register successfully', async () => {
			registerUser.mockResolvedValue({
				success: true,
				user: mockUser,
				token: mockToken,
				message: 'Registration successful'
			});

			const result = await register(userData);

			expect(result).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(authState.isAuthenticated).toBe(true);
			expect(authState.registerError).toBeNull();
			expect(setAuthToken).toHaveBeenCalledWith(mockToken);
			expect(setUserData).toHaveBeenCalledWith(mockUser);
		});

		it('should handle registration failure', async () => {
			registerUser.mockResolvedValue({
				success: false,
				message: 'Email already exists'
			});

			const result = await register(userData);

			expect(result).toBe(false);
			expect(authState.user).toBeNull();
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.registerError).toBe('Email already exists');
		});
	});

	describe('logout', () => {
		beforeEach(() => {
			// Set up authenticated state
			authState.user = mockUser;
			authState.isAuthenticated = true;
			authState.token = 'test-token';
		});

		it('should logout successfully', async () => {
			logoutUser.mockResolvedValue({
				success: true,
				message: 'Logout successful'
			});

			const result = await logout();

			expect(result).toBe(true);
			expect(authState.user).toBeNull();
			expect(authState.isAuthenticated).toBe(false);
			expect(authState.token).toBeNull();
			expect(removeAuthToken).toHaveBeenCalled();
		});

		it('should logout even if API call fails', async () => {
			logoutUser.mockRejectedValue(new Error('Server error'));

			const result = await logout();

			expect(result).toBe(true);
			expect(authState.user).toBeNull();
			expect(authState.isAuthenticated).toBe(false);
			expect(removeAuthToken).toHaveBeenCalled();
		});
	});

	describe('checkAuth', () => {
		it('should return false when no token exists', async () => {
			hasAuthToken.mockReturnValue(false);

			const result = await checkAuth();

			expect(result).toBe(false);
			expect(authState.user).toBeNull();
			expect(authState.isAuthenticated).toBe(false);
		});

		it('should update user data when token is valid', async () => {
			hasAuthToken.mockReturnValue(true);
			getCurrentUser.mockResolvedValue({
				success: true,
				user: mockUser
			});

			const result = await checkAuth();

			expect(result).toBe(true);
			expect(authState.user).toEqual(mockUser);
			expect(authState.isAuthenticated).toBe(true);
			expect(setUserData).toHaveBeenCalledWith(mockUser);
		});

		it('should clear state when token is invalid', async () => {
			hasAuthToken.mockReturnValue(true);
			getCurrentUser.mockResolvedValue({
				success: false,
				message: 'Invalid token'
			});

			const result = await checkAuth();

			expect(result).toBe(false);
			expect(authState.user).toBeNull();
			expect(authState.isAuthenticated).toBe(false);
			expect(removeAuthToken).toHaveBeenCalled();
		});
	});

	describe('email verification', () => {
		it('should send email verification successfully', async () => {
			sendEmailVerification.mockResolvedValue({
				success: true,
				message: 'Verification email sent'
			});

			const result = await sendEmailVerificationNotification();

			expect(result).toBe(true);
			expect(authState.emailVerificationError).toBeNull();
		});

		it('should handle email verification failure', async () => {
			sendEmailVerification.mockResolvedValue({
				success: false,
				message: 'Failed to send email'
			});

			const result = await sendEmailVerificationNotification();

			expect(result).toBe(false);
			expect(authState.emailVerificationError).toBe('Failed to send email');
		});

		it('should resend email verification', async () => {
			resendEmailVerification.mockResolvedValue({
				success: true,
				message: 'Verification email resent'
			});

			const result = await resendEmailVerificationNotification();

			expect(result).toBe(true);
			expect(authState.emailVerificationError).toBeNull();
		});

		it('should mark email as verified', () => {
			authState.user = { ...mockUser, email_verified: false };
			
			markEmailAsVerified();

			expect(authState.user.email_verified).toBe(true);
			expect(authState.emailVerified).toBe(true);
			expect(setUserData).toHaveBeenCalledWith(authState.user);
		});
	});

	describe('utility functions', () => {
		it('should clear all errors', () => {
			authState.error = 'test error';
			authState.loginError = 'login error';
			authState.registerError = 'register error';
			authState.emailVerificationError = 'email error';

			clearError();

			expect(authState.error).toBeNull();
			expect(authState.loginError).toBeNull();
			expect(authState.registerError).toBeNull();
			expect(authState.emailVerificationError).toBeNull();
		});

		it('should return authentication status', () => {
			authState.isAuthenticated = true;
			expect(isAuthenticated()).toBe(true);

			authState.isAuthenticated = false;
			expect(isAuthenticated()).toBe(false);
		});

		it('should return current user data', () => {
			authState.user = mockUser;
			expect(getCurrentUserData()).toEqual(mockUser);

			authState.user = null;
			expect(getCurrentUserData()).toBeNull();
		});

		it('should return email verification status', () => {
			authState.emailVerified = true;
			expect(isEmailVerified()).toBe(true);

			authState.emailVerified = false;
			expect(isEmailVerified()).toBe(false);
		});

		it('should return loading status', () => {
			expect(isLoading()).toBe(false);

			authState.loading = true;
			expect(isLoading()).toBe(true);

			authState.loading = false;
			authState.loginLoading = true;
			expect(isLoading()).toBe(true);
		});

		it('should return current error', () => {
			authState.error = 'test error';
			expect(getError()).toBe('test error');

			authState.error = null;
			expect(getError()).toBeNull();
		});
	});
});