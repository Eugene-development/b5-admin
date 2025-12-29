/**
 * JWT Logout endpoint that clears httpOnly cookie
 */

import { json } from '@sveltejs/kit';
import { getAuthApiUrl, getCookieDomain } from '$lib/config/domain.js';

/**
 * POST /api/auth/logout-jwt
 * Logout and clear JWT httpOnly cookie
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, cookies }) {
	try {
		console.log('🚪 JWT Logout (admin): Clearing httpOnly cookie');

		// Get the token to call backend logout
		const token = cookies.get('b5_auth_token');
		
		// Try to call backend logout API (optional, mainly for token invalidation)
		if (token) {
			try {
				const authApiUrl = getAuthApiUrl(request);
				await fetch(`${authApiUrl}/api/logout`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json',
						Authorization: `Bearer ${token}`
					}
				});
			} catch (err) {
				// Ignore backend logout errors - we'll clear the cookie anyway
				console.log('⚠️ Backend logout failed (ignored):', err.message);
			}
		}

		// Determine cookie domain based on current hostname
		const isProduction = process.env.NODE_ENV === 'production';
		const cookieDomain = isProduction ? getCookieDomain(request) : undefined;

		// Clear httpOnly cookie
		cookies.delete('b5_auth_token', {
			path: '/',
			domain: cookieDomain
		});

		console.log('✅ JWT Logout (admin): Cookie cleared');

		return json({
			success: true,
			message: 'Logout successful'
		});
	} catch (err) {
		console.error('❌ JWT Logout (admin): Error:', err);
		return json({
			success: true, // Still return success - cookie will be cleared
			message: 'Logout completed'
		});
	}
}
