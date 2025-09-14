/**
 * Tests for Enhanced Authentication API with Error Handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	loginUser,
	registerUser,
	logoutUser,
	getCurrentUser,
	sendEmailVerification,
	resendEmailVerification,
	verifyEmail,
	batchAuthOperations,
	authHealthCheck
} from '../authWithErrorHandling.js';

// Mock the base auth functions
vi.mock('../auth.js', () => ({
	loginUser: vi.fn(),
	registerUser: vi.fn(),
	logoutUser: vi.fn(),
	getCurrentUser: vi.fn(),
	sendEmailVerification: vi.fn(),
	resendEmailVerification: vi.fn(),
	verifyEmail: vi.fn()
}));

// Mock the error handler utilities
vi.mock('../../utils/authErrorHandler.js', () => ({
	executeCriticalAuthOperation: vi.fn(),
	handleAuthError: vi.fn(),
	formatValidationErrors: vi.fn(),
	CRITICAL_OPERATIONS: {
		LOGIN: 'login',
		LOGOUT: 'logout',
		REGISTER: 'register',
		EMAIL_VERIFICATION: 'email_verification',
		GET_USER: 'get_user'
	},
	AUTH_ERROR_MESSAGES: {
		INVALID_CREDENTIALS: 'Неверный email или пароль'
	}
}));

// Mock toast store
vi.mock('../../utils/toastStore.js', () => ({
	addSuccessToast: vi.fn(),
	addErrorToast: vi.fn()
}));

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

describe('Enhanced Authentication API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('loginUser', () => {
		it('should handle successful login', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			const { addSuccessToast } = require('../../utils/toastStore.js');
			
			const mockResult = {
				success: true,
				user: { id: 1, email: 'test@example.com' },
				token: { access_token: 'token123' }
			};
			
			executeCriticalAuthOperation.mockResolvedValue(mockResult);
			
			const result = await loginUser('test@example.com', 'password123');
			
			expect(result.success).toBe(true);
			expect(addSuccessToast).toHaveBeenCalledWith('Вход выполнен успешно!');
		});

		it('should handle login failure', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			const { AUTH_ERROR_MESSAGES } = require('../../utils/authErrorHandler.js');
			
			const mockError = new Error('Login failed');
			mockError.data = { errors: { email: ['Invalid email'] } };
			
			executeCriticalAuthOperation.mockRejectedValue(mockError);
			
			const result = await loginUser('test@example.com', 'wrongpassword');
			
			expect(result.success).toBe(false);
			expect(result.message).toBe(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
		});

		it('should not show success toast when disabled', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			const { addSuccessToast } = require('../../utils/toastStore.js');
			
			const mockResult = { success: true };
			executeCriticalAuthOperation.mockResolvedValue(mockResult);
			
			await loginUser('test@example.com', 'password123', false, { showSuccessToast: false });
			
			expect(addSuccessToast).not.toHaveBeenCalled();
		});
	});

	describe('registerUser', () => {
		it('should handle successful registration', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			const { addSuccessToast } = require('../../utils/toastStore.js');
			
			const mockResult = {
				success: true,
				user: { id: 1, email: 'test@example.com' }
			};
			
			executeCriticalAuthOperation.mockResolvedValue(mockResult);
			
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
			expect(addSuccessToast).toHaveBeenCalledWith('Регистрация прошла успешно! Проверьте email для подтверждения.');
		});

		it('should format validation errors', async () => {
			const { executeCriticalAuthOperation, formatValidationErrors } = require('../../utils/authErrorHandler.js');
			
			const mockError = new Error('Validation failed');
			mockError.data = { 
				errors: { 
					email: ['Email is required'],
					password: ['Password is too short']
				} 
			};
			
			const formattedErrors = { email: 'Email is required', password: 'Password is too short' };
			formatValidationErrors.mockReturnValue(formattedErrors);
			executeCriticalAuthOperation.mockRejectedValue(mockError);
			
			const result = await registerUser({});
			
			expect(result.success).toBe(false);
			expect(result.formattedErrors).toEqual(formattedErrors);
		});
	});

	describe('logoutUser', () => {
		it('should handle successful logout', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			const { addSuccessToast } = require('../../utils/toastStore.js');
			
			const mockResult = { success: true };
			executeCriticalAuthOperation.mockResolvedValue(mockResult);
			
			const result = await logoutUser();
			
			expect(result.success).toBe(true);
			expect(addSuccessToast).toHaveBeenCalledWith('Выход выполнен успешно');
		});

		it('should succeed even if server call fails', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			const { addSuccessToast } = require('../../utils/toastStore.js');
			
			executeCriticalAuthOperation.mockRejectedValue(new Error('Server error'));
			
			const result = await logoutUser();
			
			expect(result.success).toBe(true);
			expect(addSuccessToast).toHaveBeenCalledWith('Выход выполнен');
		});
	});

	describe('getCurrentUser', () => {
		it('should handle successful user data retrieval', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			
			const mockResult = {
				success: true,
				user: { id: 1, email: 'test@example.com' }
			};
			
			executeCriticalAuthOperation.mockResolvedValue(mockResult);
			
			const result = await getCurrentUser();
			
			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockResult.user);
		});

		it('should handle user data retrieval failure', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			
			const mockError = new Error('Unauthorized');
			executeCriticalAuthOperation.mockRejectedValue(mockError);
			
			const result = await getCurrentUser();
			
			expect(result.success).toBe(false);
			expect(result.message).toContain('Не удалось получить данные пользователя');
		});
	});

	describe('sendEmailVerification', () => {
		it('should handle successful email verification send', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			const { addSuccessToast } = require('../../utils/toastStore.js');
			
			const mockResult = { success: true };
			executeCriticalAuthOperation.mockResolvedValue(mockResult);
			
			const result = await sendEmailVerification();
			
			expect(result.success).toBe(true);
			expect(addSuccessToast).toHaveBeenCalledWith('Письмо подтверждения отправлено на ваш email');
		});
	});

	describe('resendEmailVerification', () => {
		it('should handle successful email verification resend', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			const { addSuccessToast } = require('../../utils/toastStore.js');
			
			const mockResult = { success: true };
			executeCriticalAuthOperation.mockResolvedValue(mockResult);
			
			const result = await resendEmailVerification();
			
			expect(result.success).toBe(true);
			expect(addSuccessToast).toHaveBeenCalledWith('Письмо подтверждения отправлено повторно');
		});
	});

	describe('verifyEmail', () => {
		it('should handle successful email verification', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			const { addSuccessToast } = require('../../utils/toastStore.js');
			
			const mockResult = { success: true };
			executeCriticalAuthOperation.mockResolvedValue(mockResult);
			
			const result = await verifyEmail('123', 'hash123', 'signature123');
			
			expect(result.success).toBe(true);
			expect(addSuccessToast).toHaveBeenCalledWith('Email адрес успешно подтвержден!');
		});
	});

	describe('batchAuthOperations', () => {
		it('should execute multiple operations successfully', async () => {
			const mockOp1 = vi.fn().mockResolvedValue('result1');
			const mockOp2 = vi.fn().mockResolvedValue('result2');
			
			const operations = [
				{ operation: mockOp1, args: ['arg1'] },
				{ operation: mockOp2, args: ['arg2'] }
			];
			
			const results = await batchAuthOperations(operations);
			
			expect(results).toHaveLength(2);
			expect(results[0].success).toBe(true);
			expect(results[1].success).toBe(true);
			expect(mockOp1).toHaveBeenCalledWith('arg1', {});
			expect(mockOp2).toHaveBeenCalledWith('arg2', {});
		});

		it('should handle operation failures', async () => {
			const mockOp1 = vi.fn().mockResolvedValue('result1');
			const mockOp2 = vi.fn().mockRejectedValue(new Error('Operation failed'));
			
			const operations = [
				{ operation: mockOp1 },
				{ operation: mockOp2 }
			];
			
			const results = await batchAuthOperations(operations);
			
			expect(results).toHaveLength(2);
			expect(results[0].success).toBe(true);
			expect(results[1].success).toBe(false);
		});

		it('should stop on first error when configured', async () => {
			const mockOp1 = vi.fn().mockRejectedValue(new Error('First operation failed'));
			const mockOp2 = vi.fn().mockResolvedValue('result2');
			
			const operations = [
				{ operation: mockOp1 },
				{ operation: mockOp2 }
			];
			
			const results = await batchAuthOperations(operations, { stopOnFirstError: true });
			
			expect(results).toHaveLength(1);
			expect(results[0].success).toBe(false);
			expect(mockOp2).not.toHaveBeenCalled();
		});
	});

	describe('authHealthCheck', () => {
		it('should return healthy status when auth is working', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			
			const mockResult = { success: true, user: { id: 1 } };
			executeCriticalAuthOperation.mockResolvedValue(mockResult);
			
			const result = await authHealthCheck();
			
			expect(result.healthy).toBe(true);
			expect(result.authenticated).toBe(true);
			expect(result.message).toContain('healthy');
		});

		it('should return unhealthy status when auth fails', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			
			const mockResult = { success: false };
			executeCriticalAuthOperation.mockResolvedValue(mockResult);
			
			const result = await authHealthCheck();
			
			expect(result.healthy).toBe(false);
			expect(result.authenticated).toBe(false);
			expect(result.message).toContain('issues');
		});

		it('should handle auth system not responding', async () => {
			const { executeCriticalAuthOperation } = require('../../utils/authErrorHandler.js');
			
			executeCriticalAuthOperation.mockRejectedValue(new Error('Network error'));
			
			const result = await authHealthCheck();
			
			expect(result.healthy).toBe(false);
			expect(result.authenticated).toBe(false);
			expect(result.message).toContain('not responding');
		});
	});
});