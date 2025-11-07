/**
 * API Configuration
 * Reads configuration from environment variables with compile-time replacement
 */

import { browser } from '$app/environment';
import { dev } from '$app/environment';

// Default configuration for development
const DEFAULT_CONFIG = {
	API_BASE_URL: 'http://localhost:8000', // b5-api2 GraphQL server
	AUTH_API_URL: 'http://localhost:8001', // b5-auth-2 authentication server
	FRONTEND_URL: 'http://localhost:5137' // b5-agent frontend
};

/**
 * Get API configuration
 * Priority order:
 * 1. Compile-time environment variables (VITE_*)
 * 2. Runtime environment variables for server-side (production)
 * 3. Development defaults
 */
function getApiConfig() {
	// Try to use compile-time Vite environment variables first
	const viteConfig = {
		API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
		AUTH_API_URL: import.meta.env.VITE_AUTH_API_URL,
		FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL
	};

	// Check if all required Vite environment variables are available
	if (viteConfig.API_BASE_URL && viteConfig.AUTH_API_URL && viteConfig.FRONTEND_URL) {
		return viteConfig;
	}

	// Fallback to global __APP_ENV__ if available (defined in vite.config.js)
	if (typeof globalThis !== 'undefined' && globalThis.__APP_ENV__) {
		const envConfig = globalThis.__APP_ENV__;
		if (envConfig.API_BASE_URL && envConfig.AUTH_API_URL && envConfig.FRONTEND_URL) {
			return envConfig;
		}
	}

	// Server-side rendering: try runtime environment variables for production
	if (!browser && typeof process !== 'undefined') {
		const runtimeConfig = {
			API_BASE_URL: process.env.VITE_API_BASE_URL || process.env.PUBLIC_API_BASE_URL,
			AUTH_API_URL: process.env.VITE_AUTH_API_URL || process.env.PUBLIC_AUTH_API_URL,
			FRONTEND_URL: process.env.VITE_FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL
		};

		if (runtimeConfig.API_BASE_URL && runtimeConfig.AUTH_API_URL && runtimeConfig.FRONTEND_URL) {
			return runtimeConfig;
		}
	}

	// Development fallback
	return DEFAULT_CONFIG;
}

export const config = getApiConfig();
export const { API_BASE_URL, AUTH_API_URL, FRONTEND_URL } = config;

// GraphQL endpoint for convenience
export const GRAPHQL_ENDPOINT = `${API_BASE_URL}/graphql`;
export const AUTH_ENDPOINT = `${AUTH_API_URL}/api`;
