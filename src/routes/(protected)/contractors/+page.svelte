<script>
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
</script>

<ProtectedRoute>
	{#snippet children()}
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Подрядчики</h1>
			<p class="mt-4 text-gray-600 dark:text-gray-400">Управление подрядчиками системы.</p>
		</div>
	{/snippet}
</ProtectedRoute>
