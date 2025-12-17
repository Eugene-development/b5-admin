/**
 * Server-side layout load function for b5-admin
 * Checks authentication status on every page load using Laravel Sanctum cookies
 */

import { getAuthApiUrl } from '$lib/config/domain.js';

/**
 * Load function that runs on the server for every page request
 * @type {import('./$types').LayoutServerLoad}
 */
export async function load({ fetch, cookies, request, url }) {
	try {
		// Get current pathname
		const pathname = url.pathname;
		
		// Public pages that don't need authentication check
		const publicPages = ['/login', '/register', '/forgot-password', '/reset-password', '/'];
		const isPublicPage = publicPages.some(page => pathname === page || pathname.startsWith(page + '/'));
		
		// Skip authentication check for public pages to prevent redirect loops
		if (isPublicPage) {
			console.debug('Skipping auth check for public page:', pathname);
			return {
				user: null,
				isAuthenticated: false
			};
		}

		// Get dynamic AUTH API URL based on request domain
		const authApiUrl = getAuthApiUrl(request);

		// Get session cookie from request
		const sessionCookie = cookies.get('b5_auth_2_session');
		const xsrfToken = cookies.get('XSRF-TOKEN');

		// If no session cookie or empty session cookie, user is not authenticated
		if (!sessionCookie || sessionCookie.trim() === '') {
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

		// Try to get current user data from API using session cookie
		const response = await fetch(`${authApiUrl}/api/user`, {
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

		if (response.ok) {
			const data = await response.json();
			const user = data.user || data;

			return {
				user,
				isAuthenticated: true
			};
		} else {
			// If session is invalid (401/403), explicitly delete the cookie
			if (response.status === 401 || response.status === 403) {
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
