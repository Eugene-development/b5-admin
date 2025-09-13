/**
 * Demonstration of HTTP Client usage
 * Shows how the enhanced HTTP client meets all task requirements
 * Requirements: 4.4, 5.1, 5.2, 5.3, 5.4
 */

import { api, httpClient, createHttpClient } from './http-client.js';

/**
 * Example 1: Using the default API helper functions
 * Automatically handles credentials, CSRF tokens, and error handling
 */
export async function exampleApiUsage() {
	try {
		// Initialize CSRF protection (requirement 5.2, 5.4)
		await api.initCsrf();
		
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
		// - credentials: 'include' (requirement 4.4, 5.1)
		// - X-XSRF-TOKEN header (requirement 5.2, 5.4)
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
 * Shows that all methods properly handle credentials and CSRF
 */
export async function exampleAllMethods() {
	const client = httpClient;
	
	// All of these automatically include credentials and CSRF token
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
 * ✅ 4.4 - Configure fetch to send credentials with requests
 *    - All requests use credentials: 'include'
 *    - Cookies are automatically sent with every request
 * 
 * ✅ 5.1 - Configure fetch to send credentials with requests  
 *    - Same as 4.4, implemented in HttpClient.request()
 * 
 * ✅ 5.2 - Add automatic XSRF token sending in headers
 *    - getCsrfToken() extracts token from cookies
 *    - prepareHeaders() automatically adds X-XSRF-TOKEN header
 *    - initCsrf() initializes CSRF protection
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