<script>
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
</script>

<ProtectedRoute>
	{#snippet children()}
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Кураторы</h1>
			<p class="mt-4 text-gray-600 dark:text-gray-400">Управление кураторами системы.</p>
		</div>
	{/snippet}
</ProtectedRoute>
