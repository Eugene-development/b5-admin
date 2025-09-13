/**
 * Tests for authentication functions using Svelte 5 runes
 * Requirements: All requirements through testing functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules before importing
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

// Import after mocking
import * as auth from '../auth/auth.svelte.js';
import * as httpClient from '../utils/http-client.js';

// Mock goto function
const mockGoto = vi.fn();
vi.stubGlobal('goto', mockGoto);

describe('Authentication State Management', () => {
	let mockHttpClient;

	beforeEach(() => {
		// Reset all auth state before each test
		auth.clearAuthState();
		
		// Create fresh mock HTTP client
		mockHttpClient = {
			post: vi.fn(),
			get: vi.fn()
		};
		
		// Mock createHttpClient to return our mock
		httpClient.createHttpClient.mockReturnValue(mockHttpClient);
		
		// Clear all mocks
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Clean up after each test
		auth.clearAuthState();
	});

	describe('State Management Functions', () => {
		it('should initialize with null user and empty errors', () => {
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.isAuthenticated).toBe(false);
			expect(auth.authState.isLoading).toBe(false);
			expect(auth.authState.errors).toEqual({});
		});

		it('should set user correctly', () => {
			const testUser = { id: 1, email: 'test@example.com', name: 'Test User' };
			
			auth.setUser(testUser);
			
			expect(auth.authState.user).toEqual(testUser);
			expect(auth.authState.isAuthenticated).toBe(true);
		});

		it('should clear user when set to null', () => {
			const testUser = { id: 1, email: 'test@example.com' };
			auth.setUser(testUser);
			
			auth.setUser(null);
			
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.isAuthenticated).toBe(false);
		});

		it('should set errors correctly', () => {
			const testErrors = { email: ['Email is required'], password: ['Password is too short'] };
			
			auth.setErrors(testErrors);
			
			expect(auth.authState.errors).toEqual(testErrors);
		});

		it('should handle null errors gracefully', () => {
			auth.setErrors(null);
			
			expect(auth.authState.errors).toEqual({});
		});

		it('should set loading state correctly', () => {
			auth.setLoading(true);
			expect(auth.authState.isLoading).toBe(true);
			
			auth.setLoading(false);
			expect(auth.authState.isLoading).toBe(false);
		});

		it('should handle truthy/falsy values for loading state', () => {
			auth.setLoading('truthy');
			expect(auth.authState.isLoading).toBe(true);
			
			auth.setLoading(0);
			expect(auth.authState.isLoading).toBe(false);
		});

		it('should clear errors', () => {
			auth.setErrors({ email: ['Error'], password: ['Error'] });
			
			auth.clearErrors();
			
			expect(auth.authState.errors).toEqual({});
		});

		it('should clear all auth state', () => {
			const testUser = { id: 1, email: 'test@example.com' };
			auth.setUser(testUser);
			auth.setErrors({ email: ['Error'] });
			auth.setLoading(true);
			
			auth.clearAuthState();
			
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.errors).toEqual({});
			expect(auth.authState.isLoading).toBe(false);
		});
	});

	describe('Login Function', () => {
		it('should login successfully with valid credentials', async () => {
			// Arrange
			const email = 'test@example.com';
			const password = 'password123';
			const mockUser = { id: 1, email, name: 'Test User' };
			const mockResponse = { success: true, user: mockUser };

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue(mockResponse);

			// Act
			const result = await auth.login(email, password);

			// Assert
			expect(httpClient.api.initCsrf).toHaveBeenCalledOnce();
			expect(mockHttpClient.post).toHaveBeenCalledWith('/api/login', { email, password });
			expect(auth.authState.user).toEqual(mockUser);
			expect(auth.authState.isLoading).toBe(false);
			expect(result).toEqual(mockUser);
		});

		it('should handle login with redirect option', async () => {
			// Arrange
			const email = 'test@example.com';
			const password = 'password123';
			const mockUser = { id: 1, email, name: 'Test User' };
			const mockResponse = { success: true, user: mockUser };
			const redirectTo = '/dashboard';

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue(mockResponse);

			// Act
			await auth.login(email, password, { redirectTo });

			// Assert
			expect(mockGoto).toHaveBeenCalledWith(redirectTo);
		});

		it('should handle login failure with invalid credentials', async () => {
			// Arrange
			const email = 'test@example.com';
			const password = 'wrongpassword';
			const mockError = new Error('Invalid credentials');
			mockError.status = 401;
			mockError.data = { message: 'Invalid credentials' };

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockRejectedValue(mockError);

			// Act & Assert
			await expect(auth.login(email, password)).rejects.toThrow('Invalid credentials');
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.isLoading).toBe(false);
		});

		it('should handle CSRF initialization failure', async () => {
			// Arrange
			const email = 'test@example.com';
			const password = 'password123';
			const csrfError = new Error('CSRF initialization failed');

			httpClient.api.initCsrf.mockRejectedValue(csrfError);

			// Act & Assert
			await expect(auth.login(email, password)).rejects.toThrow('CSRF initialization failed');
			expect(mockHttpClient.post).not.toHaveBeenCalled();
		});

		it('should handle unsuccessful response without user data', async () => {
			// Arrange
			const email = 'test@example.com';
			const password = 'password123';
			const mockResponse = { success: false, message: 'Login failed' };

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue(mockResponse);

			// Act & Assert
			await expect(auth.login(email, password)).rejects.toThrow('Login failed');
		});

		it('should set loading state during login process', async () => {
			// Arrange
			const email = 'test@example.com';
			const password = 'password123';
			let loadingDuringRequest = false;

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockImplementation(async () => {
				loadingDuringRequest = auth.authState.isLoading;
				return { success: true, user: { id: 1, email } };
			});

			// Act
			await auth.login(email, password);

			// Assert
			expect(loadingDuringRequest).toBe(true);
			expect(auth.authState.isLoading).toBe(false);
		});
	});

	describe('Register Function', () => {
		it('should register successfully with valid data', async () => {
			// Arrange
			const name = 'Test User';
			const email = 'test@example.com';
			const password = 'password123';
			const passwordConfirmation = 'password123';
			const mockUser = { id: 1, name, email };
			const mockResponse = { success: true, user: mockUser };

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue(mockResponse);

			// Act
			const result = await auth.register(name, email, password, passwordConfirmation);

			// Assert
			expect(httpClient.api.initCsrf).toHaveBeenCalledOnce();
			expect(mockHttpClient.post).toHaveBeenCalledWith('/api/register', {
				name,
				email,
				password,
				password_confirmation: passwordConfirmation
			});
			expect(auth.authState.user).toEqual(mockUser);
			expect(result).toEqual(mockUser);
		});

		it('should handle registration with redirect option', async () => {
			// Arrange
			const name = 'Test User';
			const email = 'test@example.com';
			const password = 'password123';
			const passwordConfirmation = 'password123';
			const mockUser = { id: 1, name, email };
			const mockResponse = { success: true, user: mockUser };
			const redirectTo = '/welcome';

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue(mockResponse);

			// Act
			await auth.register(name, email, password, passwordConfirmation, { redirectTo });

			// Assert
			expect(mockGoto).toHaveBeenCalledWith(redirectTo);
		});

		it('should handle registration validation errors', async () => {
			// Arrange
			const name = '';
			const email = 'invalid-email';
			const password = '123';
			const passwordConfirmation = '456';
			const mockError = new Error('Validation failed');
			mockError.status = 422;
			mockError.data = {
				errors: {
					name: ['Name is required'],
					email: ['Email format is invalid'],
					password: ['Password is too short'],
					password_confirmation: ['Passwords do not match']
				}
			};

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockRejectedValue(mockError);

			// Act & Assert
			await expect(auth.register(name, email, password, passwordConfirmation)).rejects.toThrow('Validation failed');
			expect(auth.authState.user).toBeNull();
		});

		it('should handle unsuccessful registration response', async () => {
			// Arrange
			const name = 'Test User';
			const email = 'test@example.com';
			const password = 'password123';
			const passwordConfirmation = 'password123';
			const mockResponse = { success: false, message: 'Registration failed' };

			httpClient.api.initCsrf.mockResolvedValue();
			mockHttpClient.post.mockResolvedValue(mockResponse);

			// Act & Assert
			await expect(auth.register(name, email, password, passwordConfirmation)).rejects.toThrow('Registration failed');
		});
	});

	describe('Logout Function', () => {
		it('should logout successfully', async () => {
			// Arrange
			const testUser = { id: 1, email: 'test@example.com' };
			auth.setUser(testUser);
			mockHttpClient.post.mockResolvedValue({ success: true });

			// Act
			await auth.logout();

			// Assert
			expect(mockHttpClient.post).toHaveBeenCalledWith('/api/logout');
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.errors).toEqual({});
			expect(auth.authState.isLoading).toBe(false);
		});

		it('should logout with redirect option', async () => {
			// Arrange
			const testUser = { id: 1, email: 'test@example.com' };
			auth.setUser(testUser);
			mockHttpClient.post.mockResolvedValue({ success: true });
			const redirectTo = '/login';

			// Act
			await auth.logout({ redirectTo });

			// Assert
			expect(mockGoto).toHaveBeenCalledWith(redirectTo);
		});

		it('should clear state even if logout request fails', async () => {
			// Arrange
			const testUser = { id: 1, email: 'test@example.com' };
			auth.setUser(testUser);
			const mockError = new Error('Network error');
			mockHttpClient.post.mockRejectedValue(mockError);

			// Act & Assert
			await expect(auth.logout()).rejects.toThrow('Network error');
			expect(auth.authState.user).toBeNull();
		});

		it('should not throw error for 401 response (already logged out)', async () => {
			// Arrange
			const testUser = { id: 1, email: 'test@example.com' };
			auth.setUser(testUser);
			const mockError = new Error('Unauthorized');
			mockError.status = 401;
			mockHttpClient.post.mockRejectedValue(mockError);

			// Act
			await auth.logout();

			// Assert - should not throw
			expect(auth.authState.user).toBeNull();
		});

		it('should redirect even on error when redirectTo is provided', async () => {
			// Arrange
			const testUser = { id: 1, email: 'test@example.com' };
			auth.setUser(testUser);
			const mockError = new Error('Unauthorized');
			mockError.status = 401;
			mockHttpClient.post.mockRejectedValue(mockError);
			const redirectTo = '/login';

			// Act
			await auth.logout({ redirectTo });

			// Assert
			expect(mockGoto).toHaveBeenCalledWith(redirectTo);
		});
	});

	describe('GetUser Function', () => {
		it('should get user successfully', async () => {
			// Arrange
			const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
			const mockResponse = { success: true, user: mockUser };
			mockHttpClient.get.mockResolvedValue(mockResponse);

			// Act
			const result = await auth.getUser();

			// Assert
			expect(mockHttpClient.get).toHaveBeenCalledWith('/api/user');
			expect(auth.authState.user).toEqual(mockUser);
			expect(auth.authState.isLoading).toBe(false);
			expect(result).toEqual(mockUser);
		});

		it('should handle unsuccessful response', async () => {
			// Arrange
			const mockResponse = { success: false };
			mockHttpClient.get.mockResolvedValue(mockResponse);

			// Act
			const result = await auth.getUser();

			// Assert
			expect(auth.authState.user).toBeNull();
			expect(result).toBeNull();
		});

		it('should handle 401 unauthorized response', async () => {
			// Arrange
			const mockError = new Error('Unauthorized');
			mockError.status = 401;
			mockHttpClient.get.mockRejectedValue(mockError);

			// Act
			const result = await auth.getUser();

			// Assert
			expect(result).toBeNull();
			expect(auth.authState.user).toBeNull();
		});

		it('should throw error for non-401 errors', async () => {
			// Arrange
			const mockError = new Error('Server error');
			mockError.status = 500;
			mockHttpClient.get.mockRejectedValue(mockError);

			// Act & Assert
			await expect(auth.getUser()).rejects.toThrow('Server error');
		});
	});

	describe('InitCsrf Function', () => {
		it('should initialize CSRF successfully', async () => {
			// Arrange
			httpClient.api.initCsrf.mockResolvedValue();

			// Act
			await auth.initCsrf();

			// Assert
			expect(httpClient.api.initCsrf).toHaveBeenCalledOnce();
		});

		it('should handle CSRF initialization failure', async () => {
			// Arrange
			const mockError = new Error('CSRF failed');
			httpClient.api.initCsrf.mockRejectedValue(mockError);

			// Act & Assert
			await expect(auth.initCsrf()).rejects.toThrow('CSRF failed');
		});
	});
});