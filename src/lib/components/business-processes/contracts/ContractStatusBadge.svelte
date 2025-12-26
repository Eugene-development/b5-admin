<script>
	import { updateContractStatus } from '$lib/api/contracts.js';
	import { addSuccessToast, handleApiError } from '$lib/utils/toastStore.js';

	let {
		contract,
		contractStatuses = [],
		onStatusChange = null,
		readonly = false
	} = $props();

	let isUpdating = $state(false);
	let showDropdown = $state(false);
	let buttonRef = $state(null);
	let dropdownPosition = $state({ top: 0, left: 0 });

	// Get current status
	let currentStatus = $derived(
		contract?.status || { value: 'Не указан', slug: null, color: '#6B7280' }
	);

	// Calculate dropdown position with smart positioning (above or below)
	function updateDropdownPosition() {
		if (buttonRef) {
			const rect = buttonRef.getBoundingClientRect();
			const dropdownHeight = 200; // Approximate height of dropdown
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
	async function handleStatusChange(newStatusSlug) {
		if (isUpdating || newStatusSlug === currentStatus.slug) {
			showDropdown = false;
			return;
		}

		isUpdating = true;
		try {
			const result = await updateContractStatus(contract.id, newStatusSlug);
			addSuccessToast('Статус договора обновлён');
			if (onStatusChange) {
				onStatusChange(result);
			}
		} catch (error) {
			console.error('Failed to update contract status:', error);
			handleApiError(error, 'Не удалось обновить статус договора');
		} finally {
			isUpdating = false;
			showDropdown = false;
		}
	}

	// Close dropdown on outside click
	function handleClickOutside(event) {
		if (showDropdown && !event.target.closest('.contract-status-dropdown')) {
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

<div class="contract-status-dropdown relative inline-block">
	{#if readonly || contractStatuses.length === 0}
		<!-- Read-only badge -->
		<span
			class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
			style="color: {currentStatus.color};"
		>
			{currentStatus.value}
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
			class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all {isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:ring-2 hover:ring-offset-1'}"
			style="color: {currentStatus.color}; --tw-ring-color: {currentStatus.color};"
		>
			{#if isUpdating}
				<svg
					class="mr-1 h-3 w-3 animate-spin flex-shrink-0"
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
		</button>

		<!-- Dropdown menu -->
		{#if showDropdown}
			<div
				class="fixed z-[9999] w-44 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700"
				style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px;"
			>
				<div class="py-1">
					{#each contractStatuses as status}
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
