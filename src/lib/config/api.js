/**
 * API Configuration
 * Reads configuration from browser environment or uses defaults
 */

import { browser } from '$app/environment';

// Default configuration for development
const DEFAULT_CONFIG = {
	API_BASE_URL: 'http://localhost:8000', // b5-api2 GraphQL server
	AUTH_API_URL: 'http://localhost:8001', // b5-auth-2 authentication server
	FRONTEND_URL: 'http://localhost:5137' // b5-agent frontend
};

// Production fallback configuration 
const PRODUCTION_FALLBACK = {
	API_BASE_URL: 'https://api.bonus.band',
	AUTH_API_URL: 'https://auth.bonus5.ru',
	FRONTEND_URL: 'https://admin.bonus.band'
};

/**
 * Get API configuration
 * Priority order:
 * 1. Browser: window.__APP_CONFIG__ (set by entrypoint.sh)
 * 2. Server production: environment variables from Docker secrets
 * 3. Server production fallback: hardcoded production URLs
 * 4. Development: localhost defaults
 */
function getApiConfig() {
	// Browser environment: use window config set by entrypoint.sh
	if (browser && typeof window !== 'undefined' && window.__APP_CONFIG__) {
		return {
			API_BASE_URL: window.__APP_CONFIG__.API_BASE_URL || DEFAULT_CONFIG.API_BASE_URL,
			AUTH_API_URL: window.__APP_CONFIG__.AUTH_API_URL || DEFAULT_CONFIG.AUTH_API_URL,
			FRONTEND_URL: window.__APP_CONFIG__.FRONTEND_URL || DEFAULT_CONFIG.FRONTEND_URL
		};
	}

	// Server-side rendering: use environment variables or fallback
	if (!browser && typeof process !== 'undefined') {
		const isProduction = process.env.NODE_ENV === 'production';
		
		if (isProduction) {
			// In production, use environment variables set by entrypoint.sh, then fallback
			return {
				API_BASE_URL: process.env.PUBLIC_API_BASE_URL || PRODUCTION_FALLBACK.API_BASE_URL,
				AUTH_API_URL: process.env.PUBLIC_AUTH_API_URL || PRODUCTION_FALLBACK.AUTH_API_URL,
				FRONTEND_URL: process.env.PUBLIC_FRONTEND_URL || PRODUCTION_FALLBACK.FRONTEND_URL
			};
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

// Debug logging in development
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
	console.log('🔧 API Config Debug:', {
		browser,
		NODE_ENV: typeof process !== 'undefined' ? process.env.NODE_ENV : 'undefined',
		hasWindowConfig: browser && typeof window !== 'undefined' && !!window.__APP_CONFIG__,
		config
	});
}
