<script>
	import { updateBonusStatus } from '$lib/api/finances.js';
	import { addSuccessToast } from '$lib/utils/toastStore.js';

	let {
		bonus,
		bonusStatuses = [],
		onStatusChange = null
	} = $props();

	let isUpdating = $state(false);
	let showDropdown = $state(false);

	// Get current status
	let currentStatus = $derived(
		bonus?.status || { code: 'accrued', name: 'Начислено' }
	);

	// Get date for current status
	function getStatusDate() {
		if (!bonus) return null;
		
		switch (currentStatus.code) {
			case 'paid':
				return bonus.paid_at;
			case 'available':
				return bonus.available_at;
			case 'accrued':
			default:
				return bonus.accrued_at;
		}
	}

	// Format date for tooltip
	function formatDate(dateString) {
		if (!dateString) return 'Дата не указана';
		const formatted = new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
		return formatted.replace(/\.\s(\d{4})\sг\./, ' $1').replace(/\.\s(\d{4})/, ' $1');
	}

	// Get status background color for the rectangle
	function getStatusBgColor(code) {
		switch (code) {
			case 'paid':
				return 'bg-green-500 dark:bg-green-600';
			case 'available':
				return 'bg-blue-500 dark:bg-blue-600';
			case 'accrued':
			default:
				return 'bg-yellow-500 dark:bg-yellow-600';
		}
	}

	// Get status dot color for dropdown items
	function getStatusDotColor(code) {
		switch (code) {
			case 'paid':
				return 'bg-green-500';
			case 'available':
				return 'bg-blue-500';
			case 'accrued':
			default:
				return 'bg-yellow-500';
		}
	}

	// Handle status change
	async function handleStatusChange(newStatusCode) {
		if (isUpdating || newStatusCode === currentStatus.code || !bonus) {
			showDropdown = false;
			return;
		}

		isUpdating = true;
		try {
			const result = await updateBonusStatus(bonus.id, newStatusCode);
			addSuccessToast('Статус бонуса обновлён');
			if (onStatusChange) {
				onStatusChange(result);
			}
		} catch (error) {
			console.error('Failed to update bonus status:', error);
		} finally {
			isUpdating = false;
			showDropdown = false;
		}
	}

	// Close dropdown on outside click
	function handleClickOutside(event) {
		if (showDropdown && !event.target.closest('.bonus-indicator-container')) {
			showDropdown = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="bonus-indicator-container relative inline-block">
	{#if !bonus}
		<span class="text-gray-400">—</span>
	{:else}
		<!-- Clickable colored rectangle with tooltip -->
		<div class="group relative inline-flex items-center justify-center">
			<button
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					showDropdown = !showDropdown;
				}}
				disabled={isUpdating}
				class="h-4 w-8 rounded transition-all {getStatusBgColor(
					currentStatus.code
				)} {isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-500'}"
			>
				{#if isUpdating}
					<svg
						class="mx-auto h-3 w-3 animate-spin text-white"
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

			<!-- Tooltip -->
			<div
				class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity duration-200 group-hover:opacity-100"
			>
				<div class="whitespace-nowrap rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-700">
					{formatDate(getStatusDate())}
				</div>
				<!-- Arrow -->
				<div class="absolute left-1/2 top-full -translate-x-1/2 transform">
					<div class="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
				</div>
			</div>
		</div>

		<!-- Dropdown menu -->
		{#if showDropdown}
			<div
				class="absolute left-0 z-50 mt-1 w-40 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700"
			>
				<div class="py-1">
					{#each bonusStatuses as status}
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
							<span class="mr-2 h-2 w-2 rounded-full {getStatusDotColor(status.code)}"></span>
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
