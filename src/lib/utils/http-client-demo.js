/**
 * Demonstration of HTTP Client usage
 * Shows how the enhanced HTTP client meets all task requirements
 * Requirements: 4.4, 5.1, 5.2, 5.3, 5.4
 */

import { api, httpClient, createHttpClient } from './http-client.js';

/**
 * Example 1: Using the default API helper functions
 * Automatically handles JWT authentication and error handling
 */
export async function exampleApiUsage() {
	try {
		// JWT tokens are automatically added to Authorization header

		// Make authenticated requests (requirement 4.4, 5.1)
		const userData = await api.get('/api/user');
		const loginResult = await api.post('/api/login', {
			email: 'user@example.com',
			password: 'password'
		});

		return { userData, loginResult };
	} catch (error) {
		// Automatic error handling and 401 redirects (requirement 5.3)
		console.error('API request failed:', error);
		throw error;
	}
}

/**
 * Example 2: Using the HTTP client directly
 * Shows manual configuration and custom error handling
 */
export async function exampleHttpClientUsage() {
	try {
		// All requests automatically include:
		// - Authorization: Bearer {token} header (requirement 4.4, 5.1)
		// - Proper error handling (requirement 5.3)

		const response = await httpClient.requestJson('/api/protected-resource');
		return response;
	} catch (error) {
		if (error.status === 401) {
			// 401 errors automatically trigger redirect to /login (requirement 5.3)
			console.log('User was redirected to login page');
		}
		throw error;
	}
}

/**
 * Example 3: Creating a custom HTTP client
 * Shows how to customize behavior while maintaining all requirements
 */
export function createCustomApiClient() {
	return createHttpClient({
		baseURL: 'https://api.example.com',
		defaultHeaders: {
			'Custom-Header': 'MyApp/1.0'
		},
		onUnauthorized: async () => {
			// Custom 401 handling (requirement 5.3)
			console.log('Custom unauthorized handler');
			// Could redirect to different page, show modal, etc.
		}
	});
}

/**
 * Example 4: Demonstrating all HTTP methods
 * Shows that all methods properly handle JWT authentication
 */
export async function exampleAllMethods() {
	const client = httpClient;

	// All of these automatically include JWT Authorization header
	const getResult = await client.get('/api/data');
	const postResult = await client.post('/api/data', { name: 'test' });
	const putResult = await client.put('/api/data/1', { name: 'updated' });
	const patchResult = await client.patch('/api/data/1', { status: 'active' });
	const deleteResult = await client.delete('/api/data/1');

	return { getResult, postResult, putResult, patchResult, deleteResult };
}

/**
 * Task Requirements Summary:
 *
 * ✅ 4.4 - Configure fetch to send authentication with requests
 *    - JWT tokens automatically added to Authorization header
 *    - Token retrieved from localStorage
 *
 * ✅ 5.1 - Configure fetch to send authentication with requests
 *    - Same as 4.4, implemented in HttpClient.request()
 *
 * ✅ 5.2 - Add automatic JWT token sending in headers
 *    - getStoredToken() retrieves token from localStorage
 *    - prepareHeaders() automatically adds Authorization: Bearer header
 *
 * ✅ 5.3 - Create wrapper for API requests with error handling
 *    - HttpClient class provides comprehensive wrapper
 *    - requestJson() handles response parsing and errors
 *    - Automatic 401 handling with onUnauthorized callback
 *
 * ✅ 5.4 - Implement automatic redirection on 401 errors
 *    - HttpClient.request() detects 401 responses
 *    - Calls onUnauthorized handler (defaults to redirect to /login)
 *    - Auth module uses custom handler to clear state and redirect
 */
