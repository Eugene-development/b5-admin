/**
 * SvelteKit server-side hooks for authentication middleware
 * Handles JWT authentication from httpOnly cookies
 * Uses status-based permissions for access control
 */

/**
 * Handle server-side requests with authentication middleware
 * Reads JWT token from httpOnly cookie and adds user data to event.locals
 * @param {Object} event - SvelteKit request event
 * @param {Function} resolve - SvelteKit resolve function
 * @returns {Promise<Response>} Response
 */
export async function handle({ event, resolve }) {
	// Try to get JWT token from httpOnly cookie
	const token = event.cookies.get('b5_auth_token');
	const userCookie = event.cookies.get('b5_auth_user');

	if (token) {
		try {
			// Parse token if it's a JSON string
			let actualToken = token;
			try {
				const parsed = JSON.parse(token);
				actualToken = parsed.access_token || parsed.token || token;
			} catch {
				// Token is already a string
			}

			// Try to get full user data from user cookie first
			let userData = null;
			if (userCookie) {
				try {
					userData = JSON.parse(userCookie);
					console.log('🔐 Auth: Got user data from cookie', {
						userId: userData.id,
						email: userData.email
					});
				} catch (e) {
					console.warn('⚠️ Auth: Failed to parse user cookie:', e);
				}
			}

			// Fallback: decode JWT to get basic user data
			if (!userData) {
				const base64Url = actualToken.split('.')[1];
				if (base64Url) {
					const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
					const jsonPayload = decodeURIComponent(
						atob(base64)
							.split('')
							.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
							.join('')
					);

					const payload = JSON.parse(jsonPayload);
					userData = {
						id: payload.sub,
						email: payload.email,
						name: payload.name,
						status_id: payload.status_id,
						type: payload.type,
						status: payload.status || {
							slug: payload.type?.toLowerCase() || 'admin'
						},
						email_verified_at: payload.email_verified ? new Date().toISOString() : null
					};
				}
			}

			if (userData) {
				event.locals.user = userData;
				event.locals.token = actualToken;
				event.locals.isAuthenticated = true;

				console.log('🔐 Auth: User authenticated via httpOnly cookie:', {
					userId: userData.id,
					email: userData.email,
					type: userData.type
				});
			}
		} catch (error) {
			console.error('Failed to decode JWT token:', error);
			event.locals.user = null;
			event.locals.token = null;
			event.locals.isAuthenticated = false;
		}
	} else {
		event.locals.user = null;
		event.locals.token = null;
		event.locals.isAuthenticated = false;
	}

	return await resolve(event);
}
