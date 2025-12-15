<script>
	import { updateOrderStatus } from '$lib/api/orders.js';
	import { addSuccessToast, handleApiError } from '$lib/utils/toastStore.js';

	let {
		order,
		orderStatuses = [],
		onStatusChange = null,
		readonly = false
	} = $props();

	let isUpdating = $state(false);
	let showDropdown = $state(false);

	// Get current status
	let currentStatus = $derived(
		order?.status || { value: 'Не указан', slug: null, color: '#6B7280' }
	);

	// Handle status change
	async function handleStatusChange(newStatusSlug) {
		if (isUpdating || newStatusSlug === currentStatus.slug) {
			showDropdown = false;
			return;
		}

		isUpdating = true;
		try {
			const result = await updateOrderStatus(order.id, newStatusSlug);
			addSuccessToast('Статус заказа обновлён');
			if (onStatusChange) {
				onStatusChange(result);
			}
		} catch (error) {
			console.error('Failed to update order status:', error);
			handleApiError(error, 'Не удалось обновить статус заказа');
		} finally {
			isUpdating = false;
			showDropdown = false;
		}
	}

	// Close dropdown on outside click
	function handleClickOutside(event) {
		if (showDropdown && !event.target.closest('.order-status-dropdown')) {
			showDropdown = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="order-status-dropdown relative inline-block">
	{#if readonly || orderStatuses.length === 0}
		<!-- Read-only badge -->
		<span
			class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
			style="background-color: {currentStatus.color}20; color: {currentStatus.color};"
		>
			{currentStatus.value}
		</span>
	{:else}
		<!-- Interactive badge with dropdown -->
		<button
			type="button"
			onclick={(e) => {
				e.stopPropagation();
				showDropdown = !showDropdown;
			}}
			disabled={isUpdating}
			class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all {isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-500'}"
			style="background-color: {currentStatus.color}20; color: {currentStatus.color};"
		>
			{#if isUpdating}
				<svg
					class="mr-1 h-3 w-3 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{/if}
			{currentStatus.value}
			<svg class="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		<!-- Dropdown menu -->
		{#if showDropdown}
			<div
				class="absolute left-0 z-50 mt-1 w-44 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700"
			>
				<div class="py-1">
					{#each orderStatuses as status}
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								handleStatusChange(status.slug);
							}}
							class="flex w-full items-center px-4 py-2 text-left text-sm {status.slug === currentStatus.slug
								? 'bg-gray-100 dark:bg-gray-600'
								: 'hover:bg-gray-50 dark:hover:bg-gray-600'} text-gray-700 dark:text-gray-200"
						>
							<span
								class="mr-2 h-2 w-2 rounded-full"
								style="background-color: {status.color};"
							></span>
							{status.value}
							{#if status.slug === currentStatus.slug}
								<svg class="ml-auto h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
