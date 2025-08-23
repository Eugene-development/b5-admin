<script>
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
</script>

<ProtectedRoute>
	{#snippet children()}
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Клиенты</h1>
			<p class="mt-4 text-gray-600 dark:text-gray-400">Управление клиентами системы.</p>
		</div>
	{/snippet}
</ProtectedRoute>
