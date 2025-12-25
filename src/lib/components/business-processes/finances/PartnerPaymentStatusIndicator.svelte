<script>
	import { updateContractPartnerPaymentStatus, updateOrderPartnerPaymentStatus } from '$lib/api/finances.js';
	import { addSuccessToast } from '$lib/utils/toastStore.js';

	let {
		sourceEntity,
		sourceType = 'contract',
		partnerPaymentStatuses = [],
		onStatusChange = null
	} = $props();

	let isUpdating = $state(false);
	let showDropdown = $state(false);

	// Get current status
	let currentStatus = $derived(
		sourceEntity?.partnerPaymentStatus || { code: 'pending', name: 'Ожидает оплаты' }
	);

	// Get status background color for the rectangle
	function getStatusBgColor(code) {
		switch (code) {
			case 'paid':
				return 'bg-green-500 dark:bg-green-600';
			case 'pending':
			default:
				return 'bg-yellow-500 dark:bg-yellow-600';
		}
	}

	// Handle status change
	async function handleStatusChange(newStatusCode) {
		if (isUpdating || newStatusCode === currentStatus.code || !sourceEntity) {
			showDropdown = false;
			return;
		}

		isUpdating = true;
		try {
			let result;
			if (sourceType === 'contract') {
				result = await updateContractPartnerPaymentStatus(sourceEntity.id, newStatusCode);
			} else {
				result = await updateOrderPartnerPaymentStatus(sourceEntity.id, newStatusCode);
			}
			addSuccessToast('Статус оплаты обновлён');
			if (onStatusChange) {
				onStatusChange(result);
			}
		} catch (error) {
			console.error('Failed to update partner payment status:', error);
		} finally {
			isUpdating = false;
			showDropdown = false;
		}
	}

	// Close dropdown on outside click
	function handleClickOutside(event) {
		if (showDropdown && !event.target.closest('.payment-indicator-container')) {
			showDropdown = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="payment-indicator-container relative inline-block">
	{#if !sourceEntity}
		<span class="text-gray-400">—</span>
	{:else}
		<!-- Clickable colored rectangle -->
		<button
			type="button"
			onclick={(e) => {
				e.stopPropagation();
				showDropdown = !showDropdown;
			}}
			disabled={isUpdating}
			class="h-6 w-16 rounded transition-all {getStatusBgColor(
				currentStatus.code
			)} {isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-500'}"
			title={currentStatus.name}
		>
			{#if isUpdating}
				<svg
					class="mx-auto h-4 w-4 animate-spin text-white"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{/if}
		</button>

		<!-- Dropdown menu -->
		{#if showDropdown}
			<div
				class="absolute left-0 z-50 mt-1 w-40 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700"
			>
				<div class="py-1">
					{#each partnerPaymentStatuses as status}
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								handleStatusChange(status.code);
							}}
							class="flex w-full items-center px-4 py-2 text-left text-sm {status.code ===
							currentStatus.code
								? 'bg-gray-100 dark:bg-gray-600'
								: 'hover:bg-gray-50 dark:hover:bg-gray-600'} text-gray-700 dark:text-gray-200"
						>
							<span
								class="mr-2 h-2 w-2 rounded-full {status.code === 'paid'
									? 'bg-green-500'
									: 'bg-yellow-500'}"
							></span>
							{status.name}
							{#if status.code === currentStatus.code}
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
