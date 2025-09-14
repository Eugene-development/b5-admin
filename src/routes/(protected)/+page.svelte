<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { isAuthenticated } from '$lib/state/auth.svelte.js';

	// Redirect to dashboard only when accessing root path directly
	onMount(() => {
		// Only redirect if we're at the exact root path "/"
		if (window.location.pathname === '/') {
			if (isAuthenticated()) {
				goto('/dashboard');
			} else {
				goto('/login');
			}
		}
	});
</script>

<!-- This page redirects users to appropriate location when accessing root -->
<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
			Добро пожаловать в B5 Admin
		</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-400">Административная панель</p>
		<div class="mt-6">
			<a
				href="/dashboard"
				class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
			>
				Перейти к панели управления
			</a>
		</div>
	</div>
</div>
