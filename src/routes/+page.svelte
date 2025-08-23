<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { isAuthenticated } from '$lib/state/auth.svelte.js';

	// Redirect to dashboard if authenticated, otherwise to login
	onMount(() => {
		if (isAuthenticated()) {
			goto('/dashboard');
		} else {
			goto('/login');
		}
	});
</script>

<!-- This page redirects users to appropriate location -->
<div class="flex items-center justify-center min-h-screen">
	<div class="text-center">
		<h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Загрузка...</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-400">Перенаправление...</p>
	</div>
</div>
