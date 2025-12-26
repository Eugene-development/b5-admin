<script>
	import { updateOrderPartnerPaymentStatus } from '$lib/api/finances.js';
	import { addSuccessToast, handleApiError } from '$lib/utils/toastStore.js';

	let {
		order,
		partnerPaymentStatuses = [],
		onStatusChange = null,
		readonly = false
	} = $props();

	let isUpdating = $state(false);
	let showDropdown = $state(false);
	let buttonRef = $state(null);
	let dropdownPosition = $state({ top: 0, left: 0 });

	// Get current status
	let currentStatus = $derived(
		order?.partnerPaymentStatus || { code: 'pending', name: 'Ожидает оплаты' }
	);

	// Get status color
	function getStatusColor(code) {
		switch (code) {
			case 'paid':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
			case 'pending':
			default:
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
		}
	}

	// Calculate dropdown position with smart positioning (above or below)
	function updateDropdownPosition() {
		if (buttonRef) {
			const rect = buttonRef.getBoundingClientRect();
			const dropdownHeight = 100; // Approximate height of dropdown
			const viewportHeight = window.innerHeight;
			const spaceBelow = viewportHeight - rect.bottom;
			const spaceAbove = rect.top;
			
			// If not enough space below and more space above, show above
			if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
				dropdownPosition = {
					top: rect.top - dropdownHeight - 4,
					left: rect.left
				};
			} else {
				dropdownPosition = {
					top: rect.bottom + 4,
					left: rect.left
				};
			}
		}
	}

	// Handle status change
	async function handleStatusChange(newStatusCode) {
		if (isUpdating || newStatusCode === currentStatus.code) {
			showDropdown = false;
			return;
		}

		isUpdating = true;
		try {
			const result = await updateOrderPartnerPaymentStatus(order.id, newStatusCode);
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
		if (showDropdown && !event.target.closest('.status-dropdown-container')) {
			showDropdown = false;
		}
	}

	// Close dropdown on scroll
	function handleScroll() {
		if (showDropdown) {
			showDropdown = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onscroll={handleScroll} />

<div class="status-dropdown-container relative inline-block">
	{#if readonly}
		<!-- Read-only badge -->
		<span
			class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(
				currentStatus.code
			)}"
		>
			{currentStatus.name}
		</span>
	{:else}
		<!-- Interactive badge with dropdown -->
		<button
			bind:this={buttonRef}
			type="button"
			onclick={(e) => {
				e.stopPropagation();
				updateDropdownPosition();
				showDropdown = !showDropdown;
			}}
			disabled={isUpdating}
			class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all {getStatusColor(
				currentStatus.code
			)} {isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-500'}"
		>
			{#if isUpdating}
				<svg
					class="mr-1 h-3 w-3 animate-spin"
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
			{currentStatus.name}
			<svg class="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		<!-- Dropdown menu -->
		{#if showDropdown}
			<div
				class="fixed z-[9999] w-40 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700"
				style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
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
