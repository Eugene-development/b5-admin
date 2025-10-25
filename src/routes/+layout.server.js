/**
 * Server-side layout load function for b5-admin
 * Checks authentication status on every page load using Laravel Sanctum cookies
 */

import { AUTH_API_URL } from '$lib/config/api.js';

/**
 * Load function that runs on the server for every page request
 * @type {import('./$types').LayoutServerLoad}
 */
export async function load({ fetch, cookies, request }) {
	try {
		console.log('🔍 Layout server load - checking authentication');

		// Get all cookies
		const allCookies = cookies.getAll();
		console.log(
			'🍪 Available cookies:',
			allCookies.map((c) => c.name)
		);

		// Get session cookie from request
		const sessionCookie = cookies.get('b5_auth_2_session');
		const xsrfToken = cookies.get('XSRF-TOKEN');

		console.log('🔑 Session cookie:', sessionCookie ? 'present' : 'missing');
		console.log('🔑 XSRF token:', xsrfToken ? 'present' : 'missing');

		// If no session cookie or empty session cookie, user is not authenticated
		if (!sessionCookie || sessionCookie.trim() === '') {
			console.log('🔒 No session cookie found - user not authenticated');
			return {
				user: null,
				isAuthenticated: false
			};
		}

		// Build cookie header with only necessary cookies
		// Only include session and XSRF cookies to avoid creating new sessions
		const cookiesToSend = [];
		if (sessionCookie) {
			cookiesToSend.push(`b5_auth_2_session=${sessionCookie}`);
		}
		if (xsrfToken) {
			cookiesToSend.push(`XSRF-TOKEN=${xsrfToken}`);
		}
		const cookieHeader = cookiesToSend.join('; ');

		console.log('📤 Making request to:', `${AUTH_API_URL}/api/user`);
		console.log('📤 Sending cookies:', cookieHeader);

		// Try to get current user data from API using session cookie
		const response = await fetch(`${AUTH_API_URL}/api/user`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Cookie: cookieHeader,
				'X-Requested-With': 'XMLHttpRequest',
				// Add referer to help with CORS
				Referer: request.headers.get('referer') || request.url
			}
		});

		console.log('📥 Response status:', response.status);

		if (response.ok) {
			const data = await response.json();
			const user = data.user || data;

			console.log('✅ User authenticated via session cookie:', user?.email);

			return {
				user,
				isAuthenticated: true
			};
		} else {
			const errorText = await response.text();
			console.log('❌ Session invalid or expired:', response.status, errorText);
			
			// If session is invalid (401/403), explicitly delete the cookie
			if (response.status === 401 || response.status === 403) {
				console.log('🗑️ Deleting invalid session cookie');
				cookies.delete('b5_auth_2_session', { path: '/' });
			}
			
			return {
				user: null,
				isAuthenticated: false
			};
		}
	} catch (error) {
		console.error('💥 Error checking authentication:', error);
		// On error, return unauthenticated state
		return {
			user: null,
			isAuthenticated: false
		};
	}
}
