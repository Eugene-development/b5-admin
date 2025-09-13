/**
 * Integration test for auth-guard middleware
 * Manual verification of middleware functionality
 * Requirements: 3.4, 4.3, 5.1
 */

import { 
	isProtectedRoute, 
	isGuestRoute, 
	getPostLoginRedirect 
} from './auth-guard.svelte.js';

/**
 * Test route detection functions
 */
export function testRouteDetection() {
	console.log('Testing route detection...');
	
	// Test protected routes
	const protectedTests = [
		{ path: '/dashboard', expected: true },
		{ path: '/dashboard/settings', expected: true },
		{ path: '/profile', expected: true },
		{ path: '/settings', expected: true },
		{ path: '/admin', expected: true },
		{ path: '/login', expected: false },
		{ path: '/', expected: false }
	];

	protectedTests.forEach(test => {
		const result = isProtectedRoute(test.path);
		console.log(`isProtectedRoute('${test.path}') = ${result} (expected: ${test.expected})`);
		if (result !== test.expected) {
			throw new Error(`Failed: isProtectedRoute('${test.path}') returned ${result}, expected ${test.expected}`);
		}
	});

	// Test guest routes
	const guestTests = [
		{ path: '/login', expected: true },
		{ path: '/register', expected: true },
		{ path: '/forgot-password', expected: true },
		{ path: '/dashboard', expected: false },
		{ path: '/', expected: false }
	];

	guestTests.forEach(test => {
		const result = isGuestRoute(test.path);
		console.log(`isGuestRoute('${test.path}') = ${result} (expected: ${test.expected})`);
		if (result !== test.expected) {
			throw new Error(`Failed: isGuestRoute('${test.path}') returned ${result}, expected ${test.expected}`);
		}
	});

	console.log('✅ Route detection tests passed');
}

/**
 * Test redirect utilities
 */
export function testRedirectUtilities() {
	console.log('Testing redirect utilities...');

	// Mock window.location for testing
	const originalLocation = globalThis.location;
	globalThis.location = { origin: 'http://localhost:5173' };

	try {
		// Test valid returnTo parameter
		const searchParams1 = new URLSearchParams('returnTo=%2Fdashboard%3Fparam%3Dvalue');
		const result1 = getPostLoginRedirect(searchParams1);
		console.log(`getPostLoginRedirect with valid returnTo: ${result1}`);
		if (result1 !== '/dashboard?param=value') {
			throw new Error(`Expected '/dashboard?param=value', got '${result1}'`);
		}

		// Test invalid returnTo parameter
		const searchParams2 = new URLSearchParams('returnTo=http://evil.com/hack');
		const result2 = getPostLoginRedirect(searchParams2, '/safe');
		console.log(`getPostLoginRedirect with invalid returnTo: ${result2}`);
		if (result2 !== '/safe') {
			throw new Error(`Expected '/safe', got '${result2}'`);
		}

		// Test no returnTo parameter
		const searchParams3 = new URLSearchParams();
		const result3 = getPostLoginRedirect(searchParams3, '/default');
		console.log(`getPostLoginRedirect with no returnTo: ${result3}`);
		if (result3 !== '/default') {
			throw new Error(`Expected '/default', got '${result3}'`);
		}

		console.log('✅ Redirect utilities tests passed');
	} finally {
		// Restore original location
		globalThis.location = originalLocation;
	}
}

/**
 * Run all integration tests
 */
export function runIntegrationTests() {
	console.log('🧪 Running auth-guard integration tests...');
	
	try {
		testRouteDetection();
		testRedirectUtilities();
		console.log('🎉 All auth-guard integration tests passed!');
		return true;
	} catch (error) {
		console.error('❌ Integration test failed:', error.message);
		return false;
	}
}