/**
 * JWT Login endpoint that sets httpOnly cookie
 * Calls the backend API and sets JWT token in httpOnly cookie
 */

import { json, error } from '@sveltejs/kit';
import { getAuthApiUrl, getCookieDomain } from '$lib/config/domain.js';

/**
 * POST /api/auth/login-jwt
 * Login and set JWT in httpOnly cookie
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, cookies }) {
	try {
		// Get login credentials from request
		const { email, password, remember } = await request.json();

		console.log('🔐 JWT Login (admin): Attempting login for:', email);

		// Get auth API URL based on current domain (pass request for server-side hostname detection)
		const authApiUrl = getAuthApiUrl(request);
		console.log('🔐 JWT Login (admin): Using auth API URL:', authApiUrl);
		
		// Call backend login API
		const response = await fetch(`${authApiUrl}/api/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({ email, password })
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('❌ JWT Login (admin): Backend login failed:', errorData);
			return json(
				{
					success: false,
					message: errorData.message || 'Login failed'
				},
				{ status: response.status }
			);
		}

		const data = await response.json();

		// Extract token from response
		const token = data.token || data.access_token;
		if (!token) {
			console.error('❌ JWT Login (admin): No token in response');
			return json(
				{
					success: false,
					message: 'No token received from server'
				},
				{ status: 500 }
			);
		}

		console.log('✅ JWT Login (admin): Login successful, setting httpOnly cookie');

		// Set httpOnly cookie with JWT token
		const cookieValue = typeof token === 'string' ? token : JSON.stringify(token);

		// Determine cookie domain based on current hostname
		const isProduction = process.env.NODE_ENV === 'production';
		const cookieDomain = isProduction ? getCookieDomain(request) : undefined;

		cookies.set('b5_auth_token', cookieValue, {
			path: '/',
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			domain: cookieDomain,
			maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 // 30 days or 1 day
		});

		console.log('🍪 Cookie set with domain:', cookieDomain || 'default (current domain)');

		// Return success response with user data and token
		return json({
			success: true,
			user: data.user,
			token: token,
			message: 'Login successful'
		});
	} catch (err) {
		console.error('❌ JWT Login (admin): Error:', err);
		throw error(500, {
			message: 'Internal server error during login'
		});
	}
}
