/**
 * Universal layout load function
 * Passes server data to the client and initializes client-side auth state
 */

/** @type {import('./$types').LayoutLoad} */
export async function load({ data }) {
	return {
		// Pass server data to client
		user: data?.user || null,
		isAuthenticated: data?.isAuthenticated || false
	};
}
