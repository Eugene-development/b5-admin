/**
 * Integration tests for API modules
 */

import { describe, it, expect } from 'vitest';

describe('API Integration', () => {
	it('should export all required functions from config', async () => {
		const configModule = await import('../config.js');
		
		expect(configModule.API_CONFIG).toBeDefined();
		expect(configModule.STORAGE_KEYS).toBeDefined();
		expect(configModule.getAuthToken).toBeTypeOf('function');
		expect(configModule.setAuthToken).toBeTypeOf('function');
		expect(configModule.removeAuthToken).toBeTypeOf('function');
		expect(configModule.hasAuthToken).toBeTypeOf('function');
		expect(configModule.getAuthHeaders).toBeTypeOf('function');
		expect(configModule.getUserData).toBeTypeOf('function');
		expect(configModule.setUserData).toBeTypeOf('function');
	});

	it('should have correct API endpoints configuration', async () => {
		const { API_CONFIG } = await import('../config.js');
		
		expect(API_CONFIG.endpoints.login).toBe('/api/auth/login');
		expect(API_CONFIG.endpoints.register).toBe('/api/auth/register');
		expect(API_CONFIG.endpoints.logout).toBe('/api/auth/logout');
		expect(API_CONFIG.endpoints.user).toBe('/api/auth/user');
		expect(API_CONFIG.endpoints.sendEmailVerification).toBe('/api/email/verification-notification');
		expect(API_CONFIG.endpoints.verifyEmail).toBe('/api/email/verify');
	});

	it('should have correct storage keys', async () => {
		const { STORAGE_KEYS } = await import('../config.js');
		
		expect(STORAGE_KEYS.AUTH_TOKEN).toBe('b5_admin_auth_token');
		expect(STORAGE_KEYS.USER_DATA).toBe('b5_admin_user_data');
	});
});