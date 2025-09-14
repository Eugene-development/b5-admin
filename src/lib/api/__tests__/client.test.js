/**
 * Tests for HTTP client functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiError, apiRequest, get, post, put, deleteRequest } from '../client.js';

// Mock the config module
vi.mock('../config.js', () => ({
	API_CONFIG: {
		baseUrl: 'http://localhost:8001',
		timeout: 5000,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		}
	},
	getAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
	removeAuthToken: vi.fn()
}));

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('HTTP Client', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.clearAllTimers();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	describe('ApiError', () => {
		it('should create ApiError with correct properties', () => {
			const error = new ApiError('Test error', 400, { field: 'error' });
			expect(error.message).toBe('Test error');
			expect(error.status).toBe(400);
			expect(error.data).toEqual({ field: 'error' });
			expect(error.name).toBe('ApiError');
		});
	});

	describe('apiRequest', () => {
		it('should make successful API request', async () => {
			const mockResponse = { success: true, data: 'test' };
			global.fetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse)
			});

			const result = await apiRequest('/test', { method: 'GET' });
			expect(result).toEqual(mockResponse);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8001/test',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						'Accept': 'application/json'
					})
				})
			);
		});

		it('should handle network errors', async () => {
			global.fetch.mockRejectedValue(new Error('Network error'));

			await expect(apiRequest('/test')).rejects.toThrow('Произошла ошибка при подключении к серверу');
		});

		it('should handle timeout', async () => {
			// Mock AbortController for timeout testing
			const mockAbort = vi.fn();
			global.AbortController = vi.fn(() => ({
				abort: mockAbort,
				signal: {}
			}));
			
			global.fetch.mockRejectedValue({ name: 'AbortError' });

			await expect(apiRequest('/test')).rejects.toThrow('Request timeout');
		});

		it('should add auth headers when required', async () => {
			global.fetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ success: true })
			});

			await apiRequest('/test', { method: 'GET' }, true);
			
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8001/test',
				expect.objectContaining({
					headers: expect.objectContaining({
						'Authorization': 'Bearer test-token'
					})
				})
			);
		});
	});

	describe('HTTP methods', () => {
		beforeEach(() => {
			global.fetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ success: true })
			});
		});

		it('should make GET request', async () => {
			await get('/test');
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8001/test',
				expect.objectContaining({ method: 'GET' })
			);
		});

		it('should make POST request', async () => {
			const data = { name: 'test' };
			await post('/test', data);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8001/test',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(data)
				})
			);
		});

		it('should make PUT request', async () => {
			const data = { name: 'test' };
			await put('/test', data);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8001/test',
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify(data)
				})
			);
		});

		it('should make DELETE request', async () => {
			await deleteRequest('/test');
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:8001/test',
				expect.objectContaining({ method: 'DELETE' })
			);
		});
	});
});