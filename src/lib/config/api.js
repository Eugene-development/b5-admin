/**
 * API Configuration
 * Uses multi-domain system from domain.js on client-side
 * Uses environment variables on server-side (SSR)
 */

import { browser } from '$app/environment';
import { getApiUrl, getAuthApiUrl } from './domain.js';

// Default configuration for development (fallback)
const DEFAULT_CONFIG = {
	API_BASE_URL: 'http://localhost:8000', // b5-api2 GraphQL server
	AUTH_API_URL: 'http://localhost:8001', // b5-auth-2 authentication server
	FRONTEND_URL: 'http://localhost:5137' // b5-agent frontend
};

/**
 * Get static API configuration from environment variables
 * Used for SSR and as fallback
 */
function getStaticConfig() {
	// Try compile-time Vite environment variables
	const viteConfig = {
		API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
		AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL,
		FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL
	};

	if (viteConfig.API_BASE_URL && viteConfig.AUTH_API_URL && viteConfig.FRONTEND_URL) {
		return viteConfig;
	}

	// Development fallback
	return DEFAULT_CONFIG;
}

// Static config for SSR and fallback
const staticConfig = getStaticConfig();

export const config = staticConfig;
export const { API_BASE_URL, AUTH_API_URL, FRONTEND_URL } = staticConfig;

/**
 * Get GraphQL endpoint dynamically based on current domain
 * On client-side: uses multi-domain system from domain.js
 * On server-side: uses static config from environment variables
 */
export function getGraphQLEndpoint() {
	// Only use multi-domain system on client-side
	if (browser) {
		try {
			const apiUrl = getApiUrl();
			if (apiUrl) {
				return `${apiUrl}/graphql`;
			}
		} catch (error) {
			console.warn('Multi-domain system failed:', error);
		}
	}
	// Server-side or fallback: use static config
	return `${API_BASE_URL}/graphql`;
}

/**
 * Get Auth endpoint dynamically based on current domain
 * On client-side: uses multi-domain system from domain.js
 * On server-side: uses static config from environment variables
 */
export function getAuthEndpoint() {
	// Only use multi-domain system on client-side
	if (browser) {
		try {
			const authApiUrl = getAuthApiUrl();
			if (authApiUrl) {
				return `${authApiUrl}/api`;
			}
		} catch (error) {
			console.warn('Multi-domain system failed:', error);
		}
	}
	// Server-side or fallback: use static config
	return `${AUTH_API_URL}/api`;
}

// Legacy exports for backward compatibility
export const GRAPHQL_ENDPOINT = `${API_BASE_URL}/graphql`;
export const AUTH_ENDPOINT = `${AUTH_API_URL}/api`;
