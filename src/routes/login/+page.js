import { redirect } from '@sveltejs/kit';

export async function load({ url }) {
	// Redirect to auth group with preserved redirectTo parameter
	const redirectTo = url.searchParams.get('redirectTo');
	const newUrl = redirectTo
		? `/(auth)/login?redirectTo=${encodeURIComponent(redirectTo)}`
		: '/(auth)/login';

	throw redirect(307, newUrl);
}
