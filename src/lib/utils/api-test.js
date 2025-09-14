/**
 * API connectivity testing utilities
 */

import { API_BASE_URL, AUTH_API_URL } from '$lib/config/api.js';

/**
 * Test GraphQL endpoint connectivity
 */
export async function testGraphQLConnection() {
	const endpoint = `${API_BASE_URL}/graphql`;
	
	console.log('🧪 Testing GraphQL connection:', endpoint);
	
	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			credentials: 'omit', // Temporarily disable credentials to avoid CORS issues
			body: JSON.stringify({
				query: '{ __schema { types { name } } }'
			})
		});

		console.log('📡 GraphQL test response:', {
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries()),
			url: response.url
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		console.log('✅ GraphQL connection successful:', {
			hasData: !!data.data,
			hasErrors: !!data.errors,
			typeCount: data.data?.__schema?.types?.length || 0
		});

		return { success: true, data };
	} catch (error) {
		console.error('❌ GraphQL connection failed:', {
			error: error.message,
			name: error.name,
			stack: error.stack
		});
		return { success: false, error: error.message };
	}
}

/**
 * Test Auth API connectivity
 */
export async function testAuthConnection() {
	const endpoint = `${AUTH_API_URL}/api/user`;
	
	console.log('🧪 Testing Auth API connection:', endpoint);
	
	try {
		const response = await fetch(endpoint, {
			method: 'GET',
			headers: {
				'Accept': 'application/json'
			},
			credentials: 'include'
		});

		console.log('📡 Auth API test response:', {
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries()),
			url: response.url
		});

		const data = await response.json();
		console.log('📊 Auth API response data:', {
			hasUser: !!data.user || !!data.id,
			isAuthenticated: response.status === 200,
			dataKeys: Object.keys(data)
		});

		return { 
			success: response.status === 200 || response.status === 401, // 401 is also valid (not authenticated)
			authenticated: response.status === 200,
			data 
		};
	} catch (error) {
		console.error('❌ Auth API connection failed:', {
			error: error.message,
			name: error.name,
			stack: error.stack
		});
		return { success: false, error: error.message };
	}
}

/**
 * Test both API connections
 */
export async function testAllConnections() {
	console.log('🚀 Starting API connectivity tests...');
	
	const results = {
		graphql: await testGraphQLConnection(),
		auth: await testAuthConnection(),
		timestamp: new Date().toISOString()
	};

	console.log('📋 API Test Results Summary:', {
		graphqlOk: results.graphql.success,
		authOk: results.auth.success,
		authenticated: results.auth.authenticated,
		allOk: results.graphql.success && results.auth.success
	});

	return results;
}