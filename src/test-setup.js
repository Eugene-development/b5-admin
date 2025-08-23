/**
 * Test setup file for Vitest
 */

import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('VITE_API_AUTH', 'http://localhost:8001');
vi.stubEnv('VITE_B5_API_URL', 'http://localhost:8000/graphql');

// Mock console methods to reduce noise in tests
global.console = {
	...console,
	error: vi.fn(),
	warn: vi.fn(),
	log: vi.fn()
};

// Mock SvelteKit modules
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn()
	},
	navigating: {
		subscribe: vi.fn()
	},
	updated: {
		subscribe: vi.fn()
	}
}));