import { redirect } from '@sveltejs/kit';

export async function load() {
	// Redirect to auth group
	throw redirect(307, '/(auth)/register');
}
