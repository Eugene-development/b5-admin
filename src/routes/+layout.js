/**
 * Universal layout load function
 * Passes server data to the client and initializes client-side auth state
 */

// Enable SSR - auth tokens are now stored in httpOnly cookies (server-accessible)
export const ssr = true;

/** @type {import('./$types').LayoutLoad} */
export async function load({ data }) {
	return {
		// Pass server data to client
		user: data?.user || null,
		isAuthenticated: data?.isAuthenticated || false
	};
}
