import { vi } from 'vitest';
import { writable } from 'svelte/store';

export const page = writable({
	url: {
		pathname: '/',
		search: '',
		searchParams: {
			get: vi.fn()
		}
	},
	params: {},
	route: { id: '/' },
	status: 200,
	error: null,
	data: {},
	form: null
});

export const navigating = writable(null);
export const updated = writable(false);