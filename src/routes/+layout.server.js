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
		const publicPages = ['/login', '/register', '/forgot-password', '/reset-password', '/', '/health', '/email-verify', '/access-denied'];
		const isPublicPage = publicPages.some(page => pathname === page || pathname.startsWith(page + '/') || pathname.startsWith(page + '?'));
		
		// Skip authentication check for public pages to prevent redirect loops
		if (isPublicPage) {
			console.debug('Skipping auth check for public page:', pathname);
			return {
				user: null,
				isAuthenticated: false,
				isPublicPage: true
			};
		}

		// Get dynamic AUTH API URL based on request domain
		const authApiUrl = getAuthApiUrl(request);

		// Get session cookie from request
		const sessionCookie = cookies.get('b5_auth_2_session');
		const xsrfToken = cookies.get('XSRF-TOKEN');
		// Also check JWT token cookie
		const jwtToken = cookies.get('b5_auth_token');

		// If no session cookie and no JWT token, user is not authenticated
		if ((!sessionCookie || sessionCookie.trim() === '') && !jwtToken) {
			console.debug('No auth cookies found for protected page:', pathname);
			return {
				user: null,
				isAuthenticated: false,
				isPublicPage: false
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

		// Build headers
		const headers = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Requested-With': 'XMLHttpRequest',
			// Add referer to help with CORS
			Referer: request.headers.get('referer') || request.url
		};

		// Add cookie header if we have session cookies
		if (cookieHeader) {
			headers.Cookie = cookieHeader;
		}

		// Add JWT Authorization header if we have JWT token
		if (jwtToken) {
			// Parse JWT token if it's JSON
			let actualToken = jwtToken;
			try {
				const parsed = JSON.parse(jwtToken);
				actualToken = parsed.access_token || parsed.token || jwtToken;
			} catch {
				// Token is already a string
			}
			headers.Authorization = `Bearer ${actualToken}`;
		}

		// Try to get current user data from API
		const response = await fetch(`${authApiUrl}/api/user`, {
			method: 'GET',
			headers
		});

		if (response.ok) {
			const data = await response.json();
			const user = data.user || data;

			return {
				user,
				isAuthenticated: true,
				isPublicPage: false
			};
		} else {
			// If session is invalid (401/403), explicitly delete the cookies
			if (response.status === 401 || response.status === 403) {
				cookies.delete('b5_auth_2_session', { path: '/' });
				cookies.delete('b5_auth_token', { path: '/' });
			}

			console.debug('Auth API returned non-ok status:', response.status, 'for path:', pathname);
			return {
				user: null,
				isAuthenticated: false,
				isPublicPage: false
			};
		}
	} catch (error) {
		console.error('💥 Error checking authentication:', error);
		// On error, return unauthenticated state
		return {
			user: null,
			isAuthenticated: false,
			isPublicPage: false
		};
	}
}
