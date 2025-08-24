// Server-side data loading removed - all data will be loaded client-side
// after authentication is initialized to avoid localStorage access on server
export const load = async ({ fetch, url }) => {
	// Return empty initial state - data will be loaded client-side
	return {
		projects: [],
		error: null
	};
};
