import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Create mock functions that can be imported
const mockGoto = vi.fn();
const mockRedirect = vi.fn();

// Mock @sveltejs/kit
vi.mock('@sveltejs/kit', () => ({
	redirect: mockRedirect
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock setTimeout for testing redirects
global.setTimeout = vi.fn((fn) => fn());

// Mock document.cookie for CSRF token tests
Object.defineProperty(document, 'cookie', {
	writable: true,
	value: ''
});

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};
global.localStorage = localStorageMock;

// Make mocks available globally for tests
global.mockGoto = mockGoto;
global.mockRedirect = mockRedirect;

// Reset all mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
	global.fetch.mockClear();
	global.setTimeout.mockClear();
	mockGoto.mockClear();
	mockRedirect.mockClear();
	localStorageMock.getItem.mockClear();
	localStorageMock.setItem.mockClear();
	localStorageMock.removeItem.mockClear();
	localStorageMock.clear.mockClear();
	document.cookie = '';
});