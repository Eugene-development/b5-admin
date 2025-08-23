/**
 * Tests for API configuration and token management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	API_CONFIG,
	STORAGE_KEYS,
	getAuthToken,
	setAuthToken,
	removeAuthToken,
	hasAuthToken,
	getAuthHeaders,
	getUserData,
	setUserData
} from '../config.js';

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

describe('API Configuration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should have correct API configuration', () => {
		expect(API_CONFIG.baseUrl).toBe(import.meta.env.VITE_API_AUTH);
		expect(API_CONFIG.endpoints).toBeDefined();
		expect(API_CONFIG.endpoints.login).toBe('/api/auth/login');
		expect(API_CONFIG.endpoints.register).toBe('/api/auth/register');
		expect(API_CONFIG.endpoints.logout).toBe('/api/auth/logout');
		expect(API_CONFIG.endpoints.user).toBe('/api/auth/user');
	});

	it('should get auth token from localStorage', () => {
		const mockToken = { access_token: 'test-token', token_type: 'Bearer' };
		localStorageMock.getItem.mockReturnValue(JSON.stringify(mockToken));

		const token = getAuthToken();
		expect(token).toBe('test-token');
		expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
	});

	it('should return null when no token exists', () => {
		localStorageMock.getItem.mockReturnValue(null);

		const token = getAuthToken();
		expect(token).toBeNull();
	});

	it('should handle invalid JSON in localStorage', () => {
		localStorageMock.getItem.mockReturnValue('invalid-json');
		console.error = vi.fn(); // Mock console.error

		const token = getAuthToken();
		expect(token).toBeNull();
		expect(console.error).toHaveBeenCalled();
	});

	it('should set auth token in localStorage', () => {
		const tokenData = { access_token: 'test-token', token_type: 'Bearer' };

		setAuthToken(tokenData);
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			STORAGE_KEYS.AUTH_TOKEN,
			JSON.stringify(tokenData)
		);
	});

	it('should remove auth token from localStorage', () => {
		removeAuthToken();
		expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
		expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_DATA);
	});

	it('should check if auth token exists', () => {
		localStorageMock.getItem.mockReturnValue(JSON.stringify({ access_token: 'test' }));
		expect(hasAuthToken()).toBe(true);

		localStorageMock.getItem.mockReturnValue(null);
		expect(hasAuthToken()).toBe(false);
	});

	it('should get auth headers', () => {
		localStorageMock.getItem.mockReturnValue(JSON.stringify({ access_token: 'test-token' }));

		const headers = getAuthHeaders();
		expect(headers).toEqual({ Authorization: 'Bearer test-token' });
	});

	it('should return null auth headers when no token', () => {
		localStorageMock.getItem.mockReturnValue(null);

		const headers = getAuthHeaders();
		expect(headers).toBeNull();
	});

	it('should get and set user data', () => {
		const userData = { id: 1, name: 'Test User', email: 'test@example.com' };

		// Test setting user data
		setUserData(userData);
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			STORAGE_KEYS.USER_DATA,
			JSON.stringify(userData)
		);

		// Test getting user data
		localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));
		const retrievedData = getUserData();
		expect(retrievedData).toEqual(userData);
	});
});