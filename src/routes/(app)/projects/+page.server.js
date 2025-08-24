import { error } from '@sveltejs/kit';
import { getAllProjects } from '$lib/api/projects.js';

export const load = async ({ fetch, url }) => {
	// Note: Authentication is handled client-side by ProtectedRoute component
	// Server-side auth check removed as token is stored in localStorage, not cookies
	try {
		const projects = await getAllProjects();

		return {
			projects: projects || [],
			error: null
		};
	} catch (err) {
		console.error('GraphQL Error:', err);

		// Determine error type and provide appropriate fallback
		let errorMessage = 'Failed to load projects';
		let shouldThrow = false;

		if (err.name === 'AbortError') {
			errorMessage = 'Request timed out. The server may be unavailable.';
		} else if (err.name === 'TypeError' && err.message.includes('fetch')) {
			errorMessage = `Network error: Unable to connect to API server at ${import.meta.env.VITE_B5_API_URL}`;
		} else if (err.response) {
			if (err.response.status >= 500) {
				errorMessage = 'Server error occurred. Please try again later.';
			} else if (err.response.status === 401) {
				errorMessage = 'Authentication required. Please log in.';
				shouldThrow = true;
			} else if (err.response.status === 403) {
				errorMessage = 'Access denied. You do not have permission to view projects.';
				shouldThrow = true;
			} else {
				errorMessage = `API error: ${err.response.errors?.[0]?.message || err.message}`;
			}
		} else {
			errorMessage = `Unexpected error: ${err.message}`;
		}

		// For critical errors, throw to show error page
		if (shouldThrow) {
			throw error(err.response?.status || 500, errorMessage);
		}

		// For non-critical errors, return empty data with error info
		return {
			projects: [],
			error: {
				message: errorMessage,
				type: 'load_error',
				canRetry: true
			}
		};
	}
};
