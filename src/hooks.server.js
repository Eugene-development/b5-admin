/**
 * SvelteKit server-side hooks for authentication middleware and domain access control
 */

import { authMiddleware } from '$lib/auth/auth-guard.svelte.js';

/**
 * Get domain-specific page configurations (same as in domainAccess.svelte.js)
 */
function getDomainPageConfig() {
	return {
		'rubonus.info': ['/actions', '/tz', '/projects'],
		'bonus.band': [
			'/projects',
			'/actions',
			'/contractors',
			'/suppliers',
			'/services',
			'/tz',
			'/bz',
			'/finance',
			'/documentation'
		],
		'd.rubonus.info': ['/bz', '/suppliers'],
		'admin.bonus.band': [
			'/agents',
			'/curators',
			'/contractors',
			'/suppliers',
			'/services',
			'/clients',
			'/projects',
			'/finance',
			'/tz',
			'/bz',
			'/actions',
			'/documentation'
		],
		localhost: [
			'/agents',
			'/curators',
			'/contractors',
			'/suppliers',
			'/services',
			'/clients',
			'/projects',
			'/finance',
			'/tz',
			'/bz',
			'/actions',
			'/documentation'
		] // For development
	};
}

/**
 * Check if the current domain is allowed to access a specific route
 * @param {string} hostname - Request hostname
 * @param {string} pathname - Request pathname
 * @returns {boolean} True if access is allowed
 */
function isDomainAllowed(hostname, pathname) {
	// Common pages accessible from all domains
	const commonPages = [
		'/dashboard',
		'/profile',
		'/settings',
		'/login',
		'/register',
		'/email-verify',
		'/health',
		'/'
	];
	if (commonPages.some((commonPath) => pathname.startsWith(commonPath))) {
		return true;
	}

	// Check localhost for development (allow all pages)
	if (hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1')) {
		return true;
	}

	// Get domain-specific configuration
	const pageConfig = getDomainPageConfig();
	const allowedPages = pageConfig[hostname] || [];

	// Check if the current route is allowed for this domain
	return allowedPages.some((allowedPath) => pathname.startsWith(allowedPath));
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
