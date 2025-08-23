/**
 * Tests for authentication API functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loginUser, registerUser, logoutUser, getCurrentUser, sendEmailVerification, resendEmailVerification, verifyEmail } from '../auth.js';

// Mock the client module
vi.mock('../client.js', () => ({
	post: vi.fn(),
	get: vi.fn()
}));

// Mock the config module
vi.mock('../config.js', () => ({
	API_CONFIG: {
		endpoints: {
			login: '/api/auth/login',
			register: '/api/auth/register',
			logout: '/api/auth/logout',
			user: '/api/auth/user',
			sendEmailVerification: '/api/email/verification-notification',
			verifyEmail: '/api/email/verify'
		}
	}
}));

import { post, get } from '../client.js';

describe('Authentication API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('loginUser', () => {
		it('should login user successfully', async () => {
			const mockResponse = {
				user: { id: 1, email: 'test@example.com' },
				token: { access_token: 'test-token' },
				message: 'Login successful'
			};
			post.mockResolvedValue(mockResponse);

			const result = await loginUser('test@example.com', 'password', true);

			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockResponse.user);
			expect(result.token).toEqual(mockResponse.token);
			expect(post).toHaveBeenCalledWith('/api/auth/login', {
				email: 'test@example.com',
				password: 'password',
				remember: true
			});
		});

		it('should handle login failure', async () => {
			const mockError = new Error('Invalid credentials');
			mockError.data = { errors: { email: ['Invalid email'] } };
			post.mockRejectedValue(mockError);

			const result = await loginUser('test@example.com', 'wrong-password');

			expect(result.success).toBe(false);
			expect(result.message).toBe('Invalid credentials');
			expect(result.errors).toEqual({ email: ['Invalid email'] });
		});

		it('should handle 401 error with specific message', async () => {
			const mockError = new Error('Unauthorized');
			mockError.status = 401;
			post.mockRejectedValue(mockError);

			const result = await loginUser('test@example.com', 'wrong-password');

			expect(result.success).toBe(false);
			expect(result.message).toBe('Unauthorized');
		});

		it('should handle network error', async () => {
			const mockError = new Error('Произошла ошибка при подключении к серверу');
			mockError.status = 0;
			post.mockRejectedValue(mockError);

			const result = await loginUser('test@example.com', 'password');

			expect(result.success).toBe(false);
			expect(result.message).toBe('Произошла ошибка при подключении к серверу');
		});
	});

	describe('registerUser', () => {
		it('should register user successfully', async () => {
			const mockResponse = {
				user: { id: 1, email: 'test@example.com' },
				message: 'Registration successful'
			};
			post.mockResolvedValue(mockResponse);

			const userData = {
				name: 'Test User',
				email: 'test@example.com',
				password: 'password123',
				password_confirmation: 'password123',
				city: 'Test City',
				terms_accepted: true
			};

			const result = await registerUser(userData);

			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockResponse.user);
			expect(post).toHaveBeenCalledWith('/api/auth/register', userData);
		});

		it('should handle validation errors', async () => {
			const mockError = new Error('Validation failed');
			mockError.status = 422;
			mockError.data = { errors: { email: ['Email already exists'] } };
			post.mockRejectedValue(mockError);

			const result = await registerUser({});

			expect(result.success).toBe(false);
			expect(result.message).toBe('Validation failed');
			expect(result.errors).toEqual({ email: ['Email already exists'] });
		});
	});

	describe('logoutUser', () => {
		it('should logout user successfully', async () => {
			const mockResponse = { message: 'Logout successful' };
			post.mockResolvedValue(mockResponse);

			const result = await logoutUser();

			expect(result.success).toBe(true);
			expect(result.message).toBe('Logout successful');
			expect(post).toHaveBeenCalledWith('/api/auth/logout', {}, {}, true);
		});

		it('should handle logout failure gracefully', async () => {
			post.mockRejectedValue(new Error('Server error'));

			const result = await logoutUser();

			expect(result.success).toBe(true);
			expect(result.message).toBe('Logout completed');
		});
	});

	describe('getCurrentUser', () => {
		it('should get current user successfully', async () => {
			const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
			get.mockResolvedValue({ user: mockUser });

			const result = await getCurrentUser();

			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockUser);
			expect(get).toHaveBeenCalledWith('/api/auth/user', {}, true);
		});
	});

	describe('sendEmailVerification', () => {
		it('should send email verification successfully', async () => {
			const mockResponse = { message: 'Verification email sent' };
			post.mockResolvedValue(mockResponse);

			const result = await sendEmailVerification();

			expect(result.success).toBe(true);
			expect(result.message).toBe('Verification email sent');
			expect(post).toHaveBeenCalledWith('/api/email/verification-notification', {}, {}, true);
		});

		it('should handle email verification failure', async () => {
			const mockError = new Error('Failed to send email');
			mockError.data = { errors: { email: ['Email not found'] } };
			post.mockRejectedValue(mockError);

			const result = await sendEmailVerification();

			expect(result.success).toBe(false);
			expect(result.message).toBe('Failed to send email');
			expect(result.errors).toEqual({ email: ['Email not found'] });
		});
	});

	describe('resendEmailVerification', () => {
		it('should resend email verification successfully', async () => {
			const mockResponse = { message: 'Verification email sent' };
			post.mockResolvedValue(mockResponse);

			const result = await resendEmailVerification();

			expect(result.success).toBe(true);
			expect(result.message).toBe('Verification email sent');
			expect(post).toHaveBeenCalledWith('/api/email/verification-notification', {}, {}, true);
		});

		it('should handle resend email verification failure', async () => {
			const mockError = new Error('Rate limit exceeded');
			post.mockRejectedValue(mockError);

			const result = await resendEmailVerification();

			expect(result.success).toBe(false);
			expect(result.message).toBe('Rate limit exceeded');
		});
	});

	describe('verifyEmail', () => {
		it('should verify email successfully', async () => {
			const mockResponse = { message: 'Email verified successfully' };
			get.mockResolvedValue(mockResponse);

			const result = await verifyEmail('123', 'abc123hash', 'signature123');

			expect(result.success).toBe(true);
			expect(result.message).toBe('Email verified successfully');
			expect(get).toHaveBeenCalledWith('/api/email/verify/123/abc123hash?signature=signature123', {}, true);
		});

		it('should handle email verification failure', async () => {
			const mockError = new Error('Invalid verification link');
			mockError.data = { errors: { verification: ['Link expired'] } };
			get.mockRejectedValue(mockError);

			const result = await verifyEmail('123', 'invalid-hash', 'invalid-signature');

			expect(result.success).toBe(false);
			expect(result.message).toBe('Invalid verification link');
			expect(result.errors).toEqual({ verification: ['Link expired'] });
		});

		it('should handle missing parameters', async () => {
			const mockError = new Error('Missing parameters');
			get.mockRejectedValue(mockError);

			const result = await verifyEmail('', '', '');

			expect(result.success).toBe(false);
			expect(result.message).toBe('Missing parameters');
		});
	});
});