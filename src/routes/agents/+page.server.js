import { gql, request } from 'graphql-request';
import { error } from '@sveltejs/kit';

export const load = async ({ fetch }) => {
	const query = gql`
		{
			users {
				id
				city
				name
				email
				email_verified_at
				created_at
				updated_at
				status
			}
		}
	`;
	
	try {
		// Add timeout and retry logic
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
		
		const data = await request(
			import.meta.env.VITE_B5_API_URL, 
			query,
			{},
			{
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		);
		
		clearTimeout(timeoutId);
		

		
		return {
			agents: data.users || [],
			error: null
		};
	} catch (err) {
		console.error('GraphQL Error:', err);
		
		// Determine error type and provide appropriate fallback
		let errorMessage = 'Failed to load agents';
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
				errorMessage = 'Access denied. You do not have permission to view agents.';
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
			agents: [],
			error: {
				message: errorMessage,
				type: 'load_error',
				canRetry: true
			}
		};
	}
};
