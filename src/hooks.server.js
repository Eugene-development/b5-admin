/**
 * SvelteKit server-side hooks for authentication middleware and domain access control
 * Requirements: 5.1
 */

import { authMiddleware } from '$lib/auth/auth-guard.svelte.js';

/**
 * Check if the current domain is allowed to access a specific route
 * @param {string} hostname - Request hostname
 * @param {string} pathname - Request pathname
 * @returns {boolean} True if access is allowed
 */
function isDomainAllowed(hostname, pathname) {
	// Define routes that require admin domain access
	const adminOnlyRoutes = ['/test', '/test2'];
	
	// Check if the current route requires admin domain
	const requiresAdminDomain = adminOnlyRoutes.some((route) => pathname.startsWith(route));
	
	if (requiresAdminDomain) {
		// Only allow admin.bonus.band for admin-only routes
		// Also allow localhost for development
		return hostname === 'admin.bonus.band' || hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
	}
	
	// All other routes are accessible from any domain
	return true;
}

/**
 * Handle server-side requests with authentication middleware and domain access control
 * @param {Object} event - SvelteKit request event
 * @param {Function} resolve - SvelteKit resolve function
 * @returns {Promise<Response>} Response
 */
export async function handle({ event, resolve }) {
	const { url } = event;
	const hostname = url.hostname;
	const pathname = url.pathname;
	
	// Check domain access control first
	if (!isDomainAllowed(hostname, pathname)) {
		// Return 403 Forbidden for unauthorized domain access
		return new Response(
			`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Access Denied - 403</title>
	<style>
		body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
		.container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
		h1 { color: #e74c3c; margin-bottom: 20px; }
		p { color: #666; line-height: 1.6; }
		.domain-info { background: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; }
	</style>
</head>
<body>
	<div class="container">
		<h1>🚫 Access Denied</h1>
		<p>This page is only accessible from the admin domain.</p>
		<div class="domain-info">
			<p><strong>Current domain:</strong> ${hostname}</p>
			<p><strong>Required domain:</strong> admin.bonus.band</p>
		</div>
		<p>Please access this page from the correct domain.</p>
	</div>
</body>
</html>`,
			{
				status: 403,
				headers: {
					'Content-Type': 'text/html; charset=utf-8'
				}
			}
		);
	}
	
	// Apply authentication middleware
	return await authMiddleware({ event, resolve });
}
