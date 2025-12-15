/**
 * API Configuration
 * Uses multi-domain system from domain.js with fallback to environment variables
 */

import { browser } from '$app/environment';
import { getApiUrl, getAuthApiUrl, getCurrentHostname } from './domain.js';

// Default configuration for development (fallback)
const DEFAULT_CONFIG = {
	API_BASE_URL: 'http://localhost:8000', // b5-api2 GraphQL server
	AUTH_API_URL: 'http://localhost:8001', // b5-auth-2 authentication server
	FRONTEND_URL: 'http://localhost:5137' // b5-agent frontend
};

/**
 * Get API configuration
 * Priority order:
 * 1. Multi-domain system (domain.js) - based on current hostname
 * 2. Compile-time environment variables (VITE_*) - fallback
 * 3. Development defaults
 */
function getApiConfig() {
	// Try multi-domain system first (works on both client and server)
	try {
		const apiUrl = getApiUrl();
		const authApiUrl = getAuthApiUrl();
		
		if (apiUrl && authApiUrl) {
			return {
				API_BASE_URL: apiUrl,
				AUTH_API_URL: authApiUrl,
				FRONTEND_URL: browser ? window.location.origin : ''
			};
		}
	} catch (error) {
		console.warn('Multi-domain system failed, falling back to env variables:', error);
	}

	// Fallback to compile-time Vite environment variables
	const viteConfig = {
		API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
		AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL,
		FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL
	};

	// Check if all required Vite environment variables are available
	if (viteConfig.API_BASE_URL && viteConfig.AUTH_API_URL && viteConfig.FRONTEND_URL) {
		return viteConfig;
	}

	// Development fallback
	return DEFAULT_CONFIG;
}

export const config = getApiConfig();
export const { API_BASE_URL, AUTH_API_URL, FRONTEND_URL } = config;

/**
 * Get GraphQL endpoint dynamically based on current domain
 * This ensures the correct API URL is used for multi-domain setups
 */
export function getGraphQLEndpoint() {
	try {
		const apiUrl = getApiUrl();
		if (apiUrl) {
			return `${apiUrl}/graphql`;
		}
	} catch (error) {
		// Fallback to static config
	}
	return `${API_BASE_URL}/graphql`;
}

/**
 * Get Auth endpoint dynamically based on current domain
 */
export function getAuthEndpoint() {
	try {
		const authApiUrl = getAuthApiUrl();
		if (authApiUrl) {
			return `${authApiUrl}/api`;
		}
	} catch (error) {
		// Fallback to static config
	}
	return `${AUTH_API_URL}/api`;
}

// Legacy exports for backward compatibility
// These use static config from env variables as fallback
export const GRAPHQL_ENDPOINT = getGraphQLEndpoint();
export const AUTH_ENDPOINT = getAuthEndpoint();
