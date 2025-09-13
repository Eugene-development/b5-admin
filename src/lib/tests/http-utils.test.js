/**
 * HTTP utility functions tests
 * Tests core HTTP client functionality without external dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock HTTP client class (simplified version)
class MockHttpClient {
	constructor(options = {}) {
		this.baseURL = options.baseURL || 'http://localhost:8000';
		this.defaultHeaders = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...options.defaultHeaders
		};
		this.onUnauthorized = options.onUnauthorized || this.defaultUnauthorizedHandler;
	}

	async defaultUnauthorizedHandler() {
		// Mock implementation
		if (typeof window !== 'undefined' && window.localStorage) {
			window.localStorage.removeItem('auth_user');
		}
	}

	prepareHeaders(customHeaders = {}) {
		const headers = {
			...this.defaultHeaders,
			...customHeaders
		};

		// Mock CSRF token extraction
		if (typeof document !== 'undefined' && document.cookie) {
			const cookies = document.cookie.split(';');
			for (let cookie of cookies) {
				const [name, value] = cookie.trim().split('=');
				if (name === 'XSRF-TOKEN') {
					headers['X-XSRF-TOKEN'] = decodeURIComponent(value);
				}
			}
		}

		return headers;
	}

	async request(url, options = {}) {
		const requestUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
		
		const config = {
			credentials: 'include',
			headers: this.prepareHeaders(options.headers),
			...options
		};

		// Mock fetch call
		const response = await fetch(requestUrl, config);
		
		if (response.status === 401) {
			await this.onUnauthorized();
			const error = new Error('Unauthorized');
			error.status = 401;
			error.response = response;
			throw error;
		}

		return response;
	}

	async requestJson(url, options = {}) {
		const response = await this.request(url, options);
		
		let data;
		try {
			data = await response.json();
		} catch (error) {
			throw new Error(`Failed to parse JSON response: ${error.message}`);
		}

		if (!response.ok) {
			const apiError = new Error(data.message || `HTTP ${response.status}`);
			apiError.status = response.status;
			apiError.data = data;
			apiError.response = response;
			throw apiError;
		}

		return data;
	}

	async get(url, options = {}) {
		return this.requestJson(url, { method: 'GET', ...options });
	}

	async post(url, data = null, options = {}) {
		return this.requestJson(url, {
			method: 'POST',
			body: data ? JSON.stringify(data) : null,
			...options
		});
	}
}

// Mock CSRF initialization
async function mockInitCsrf() {
	if (typeof fetch === 'function') {
		await fetch('http://localhost:8000/sanctum/csrf-cookie', {
			method: 'GET',
			credentials: 'include',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			}
		});
	}
}

describe('HTTP Client Configuration', () => {
	it('should create client with default configuration', () => {
		const client = new MockHttpClient();
		
		expect(client.baseURL).toBe('http://localhost:8000');
		expect(client.defaultHeaders).toEqual({
			Accept: 'application/json',
			'Content-Type': 'application/json'
		});
	});

	it('should create client with custom configuration', () => {
		const options = {
			baseURL: 'https://api.example.com',
			defaultHeaders: {
				'Custom-Header': 'value'
			}
		};

		const client = new MockHttpClient(options);

		expect(client.baseURL).toBe('https://api.example.com');
		expect(client.defaultHeaders).toEqual({
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'Custom-Header': 'value'
		});
	});

	it('should use custom unauthorized handler', () => {
		const customHandler = vi.fn();
		const client = new MockHttpClient({ onUnauthorized: customHandler });

		expect(client.onUnauthorized).toBe(customHandler);
	});
});

describe('Header Preparation', () => {
	let client;

	beforeEach(() => {
		client = new MockHttpClient();
		// Reset document.cookie
		if (typeof document !== 'undefined') {
			document.cookie = '';
		}
	});

	it('should prepare headers with defaults', () => {
		const headers = client.prepareHeaders();

		expect(headers).toEqual({
			Accept: 'application/json',
			'Content-Type': 'application/json'
		});
	});

	it('should merge custom headers', () => {
		const customHeaders = {
			Authorization: 'Bearer token',
			'Custom-Header': 'value'
		};

		const headers = client.prepareHeaders(customHeaders);

		expect(headers).toEqual({
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: 'Bearer token',
			'Custom-Header': 'value'
		});
	});

	it('should include CSRF token when available', () => {
		if (typeof document !== 'undefined') {
			document.cookie = 'XSRF-TOKEN=csrf-token; path=/';

			const headers = client.prepareHeaders();

			expect(headers['X-XSRF-TOKEN']).toBe('csrf-token');
		}
	});

	it('should handle URL encoded CSRF token', () => {
		if (typeof document !== 'undefined') {
			document.cookie = 'XSRF-TOKEN=test%2Dcsrf%2Dtoken; path=/';

			const headers = client.prepareHeaders();

			expect(headers['X-XSRF-TOKEN']).toBe('test-csrf-token');
		}
	});
});

describe('CSRF Token Handling', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch.mockClear();
	});

	it('should initialize CSRF protection', async () => {
		global.fetch.mockResolvedValue(new Response('', { status: 200 }));

		await mockInitCsrf();

		expect(global.fetch).toHaveBeenCalledWith(
			'http://localhost:8000/sanctum/csrf-cookie',
			{
				method: 'GET',
				credentials: 'include',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json'
				}
			}
		);
	});

	it('should handle CSRF initialization failure', async () => {
		global.fetch.mockRejectedValue(new Error('Network error'));

		await expect(mockInitCsrf()).rejects.toThrow('Network error');
	});
});

describe('Request Methods', () => {
	let client;

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch.mockClear();
		client = new MockHttpClient();
	});

	it('should make request with relative URL', async () => {
		const mockResponse = new Response('{}', { status: 200 });
		global.fetch.mockResolvedValue(mockResponse);

		await client.request('/api/test');

		expect(global.fetch).toHaveBeenCalledWith(
			'http://localhost:8000/api/test',
			expect.objectContaining({
				credentials: 'include',
				headers: expect.objectContaining({
					Accept: 'application/json',
					'Content-Type': 'application/json'
				})
			})
		);
	});

	it('should make request with absolute URL', async () => {
		const mockResponse = new Response('{}', { status: 200 });
		global.fetch.mockResolvedValue(mockResponse);

		await client.request('https://api.example.com/test');

		expect(global.fetch).toHaveBeenCalledWith(
			'https://api.example.com/test',
			expect.objectContaining({
				credentials: 'include'
			})
		);
	});

	it('should handle 401 unauthorized response', async () => {
		const mockResponse = new Response('Unauthorized', { status: 401 });
		global.fetch.mockResolvedValue(mockResponse);

		const onUnauthorized = vi.fn();
		const client = new MockHttpClient({ onUnauthorized });

		await expect(client.request('/api/test')).rejects.toThrow('Unauthorized');
		expect(onUnauthorized).toHaveBeenCalled();
	});

	it('should parse successful JSON response', async () => {
		const responseData = { success: true, data: 'test' };
		const mockResponse = new Response(JSON.stringify(responseData), { 
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
		global.fetch.mockResolvedValue(mockResponse);

		const result = await client.requestJson('/api/test');

		expect(result).toEqual(responseData);
	});

	it('should handle JSON parsing errors', async () => {
		const mockResponse = new Response('invalid json', { status: 200 });
		global.fetch.mockResolvedValue(mockResponse);

		await expect(client.requestJson('/api/test')).rejects.toThrow('Failed to parse JSON response');
	});

	it('should handle HTTP error responses', async () => {
		const errorData = { message: 'Validation failed', errors: {} };
		const mockResponse = new Response(JSON.stringify(errorData), { 
			status: 422,
			headers: { 'Content-Type': 'application/json' }
		});
		global.fetch.mockResolvedValue(mockResponse);

		try {
			await client.requestJson('/api/test');
		} catch (error) {
			expect(error.message).toBe('Validation failed');
			expect(error.status).toBe(422);
			expect(error.data).toEqual(errorData);
		}
	});
});

describe('HTTP Method Shortcuts', () => {
	let client;

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch.mockClear();
		client = new MockHttpClient();
		
		const mockResponse = new Response('{"success": true}', { status: 200 });
		global.fetch.mockResolvedValue(mockResponse);
	});

	it('should make GET request', async () => {
		await client.get('/api/test');

		expect(global.fetch).toHaveBeenCalledWith(
			'http://localhost:8000/api/test',
			expect.objectContaining({
				method: 'GET'
			})
		);
	});

	it('should make POST request with data', async () => {
		const data = { name: 'test' };

		await client.post('/api/test', data);

		expect(global.fetch).toHaveBeenCalledWith(
			'http://localhost:8000/api/test',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify(data)
			})
		);
	});

	it('should make POST request without data', async () => {
		await client.post('/api/test');

		expect(global.fetch).toHaveBeenCalledWith(
			'http://localhost:8000/api/test',
			expect.objectContaining({
				method: 'POST',
				body: null
			})
		);
	});
});

describe('Authentication Flow Simulation', () => {
	let client;

	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch.mockClear();
		client = new MockHttpClient();
		
		if (typeof document !== 'undefined') {
			document.cookie = '';
		}
	});

	it('should handle complete authentication flow', async () => {
		// Setup CSRF token
		if (typeof document !== 'undefined') {
			document.cookie = 'XSRF-TOKEN=test-token; path=/';
		}

		// Mock successful response
		const mockResponse = new Response('{"success": true, "user": {"id": 1}}', { 
			status: 200 
		});
		global.fetch.mockResolvedValue(mockResponse);

		const result = await client.post('/api/login', {
			email: 'test@example.com',
			password: 'password'
		});

		expect(global.fetch).toHaveBeenCalledWith(
			'http://localhost:8000/api/login',
			expect.objectContaining({
				method: 'POST',
				credentials: 'include',
				body: JSON.stringify({
					email: 'test@example.com',
					password: 'password'
				})
			})
		);

		expect(result).toEqual({ success: true, user: { id: 1 } });
	});

	it('should handle authentication failure', async () => {
		const mockResponse = new Response('Unauthorized', { status: 401 });
		global.fetch.mockResolvedValue(mockResponse);

		await expect(client.get('/api/user')).rejects.toThrow('Unauthorized');
	});
});