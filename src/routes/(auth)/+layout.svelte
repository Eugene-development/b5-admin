<script>
	import { onMount } from 'svelte';
	import { authState, initializeAuth, isAuthenticated } from '$lib/state/auth.svelte.js';
	import { goto } from '$app/navigation';

	let { children } = $props();

	// Check if user is already authenticated and redirect if needed
	onMount(async () => {
		// Wait a bit for potential auth initialization by global layout
		await new Promise((resolve) => setTimeout(resolve, 100));

		// If user is already authenticated, redirect to dashboard
		if (authState.initialized && isAuthenticated()) {
			goto('/dashboard');
		}
	});
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<!-- Полностью изолированный layout для авторизации -->
<div
	class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950"
>
	<!-- Фоновые декоративные элементы -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="absolute -right-80 -top-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-600/20 blur-3xl"
		></div>
		<div
			class="absolute -bottom-40 -left-80 h-80 w-80 animate-pulse rounded-full bg-gradient-to-r from-purple-400/20 to-pink-600/20 blur-3xl delay-1000"
		></div>
		<div
			class="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 transform animate-pulse rounded-full bg-gradient-to-r from-indigo-400/10 to-purple-600/10 blur-3xl delay-500"
		></div>
	</div>

	<!-- Контейнер для содержимого -->
	<div class="relative z-10 flex min-h-screen items-center justify-center p-4">
		<div class="w-full max-w-3xl">
			{@render children?.()}
		</div>
	</div>
</div>
