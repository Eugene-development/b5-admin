<script>
	import { updateBonusStatus } from '$lib/api/finances.js';
	import { addSuccessToast } from '$lib/utils/toastStore.js';
	import { onMount, onDestroy } from 'svelte';

	let {
		bonus,
		bonusStatuses = [],
		onStatusChange = null,
		readonly = false
	} = $props();

	let isUpdating = $state(false);
	let showDropdown = $state(false);
	let buttonRef = $state(null);
	let portalContainer = null;

	let currentStatus = $derived(
		bonus?.status || { code: 'accrued', name: 'Начислено' }
	);

	function getStatusColor(code) {
		switch (code) {
			case 'paid':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
			case 'available':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
			case 'accrued':
			default:
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
		}
	}

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

	// Create portal container on mount
	onMount(() => {
		portalContainer = document.createElement('div');
		portalContainer.id = `bonus-dropdown-portal-${bonus?.id || Math.random().toString(36).substr(2, 9)}`;
		document.body.appendChild(portalContainer);
	});

	// Cleanup portal on destroy
	onDestroy(() => {
		if (portalContainer && portalContainer.parentNode) {
			portalContainer.parentNode.removeChild(portalContainer);
		}
	});

	function toggleDropdown() {
		showDropdown = !showDropdown;
		if (showDropdown) {
			renderDropdown();
		} else {
			clearDropdown();
		}
	}

	function clearDropdown() {
		if (portalContainer) {
			portalContainer.innerHTML = '';
		}
	}

	function renderDropdown() {
		if (!portalContainer || !buttonRef) return;
		
		const rect = buttonRef.getBoundingClientRect();
		const dropdownHeight = 120;
		const viewportHeight = window.innerHeight;
		const spaceBelow = viewportHeight - rect.bottom;
		const spaceAbove = rect.top;
		const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
		
		const topStyle = openUp 
			? `bottom: ${window.innerHeight - rect.top + 4}px`
			: `top: ${rect.bottom + 4}px`;
		
		portalContainer.innerHTML = `
			<div 
				class="fixed z-[9999] w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700"
				style="${topStyle}; left: ${rect.left}px;"
			>
				<div class="py-1">
					${bonusStatuses.map(status => `
						<button
							type="button"
							data-status-code="${status.code}"
							class="flex w-full items-center px-4 py-2 text-left text-sm ${status.code === currentStatus.code ? 'bg-gray-100 dark:bg-gray-600' : 'hover:bg-gray-50 dark:hover:bg-gray-600'} text-gray-700 dark:text-gray-200"
						>
							<span class="mr-2 h-2 w-2 rounded-full ${getStatusDotColor(status.code)}"></span>
							${status.name}
							${status.code === currentStatus.code ? `
								<svg class="ml-auto h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							` : ''}
						</button>
					`).join('')}
				</div>
			</div>
		`;
		
		// Add click handlers
		portalContainer.querySelectorAll('button[data-status-code]').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				const code = btn.getAttribute('data-status-code');
				handleStatusChange(code);
			});
		});
	}

	async function handleStatusChange(newStatusCode) {
		if (isUpdating || newStatusCode === currentStatus.code) {
			showDropdown = false;
			clearDropdown();
			return;
		}

		isUpdating = true;
		showDropdown = false;
		clearDropdown();
		
		try {
			const result = await updateBonusStatus(bonus.id, newStatusCode);
			addSuccessToast('Статус выплаты обновлён');
			if (onStatusChange) {
				onStatusChange(result);
			}
		} catch (error) {
			console.error('Failed to update bonus status:', error);
		} finally {
			isUpdating = false;
		}
	}

	function handleClickOutside(event) {
		if (showDropdown && !event.target.closest('.bonus-status-dropdown') && !event.target.closest('[data-status-code]')) {
			showDropdown = false;
			clearDropdown();
		}
	}

	// Close dropdown on scroll
	function handleScroll() {
		if (showDropdown) {
			showDropdown = false;
			clearDropdown();
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onscroll={handleScroll} />

<div class="bonus-status-dropdown relative inline-block">
	{#if readonly}
		<span
			class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(currentStatus.code)}"
		>
			{currentStatus.name}
		</span>
	{:else}
		<button
			bind:this={buttonRef}
			type="button"
			onclick={(e) => {
				e.stopPropagation();
				toggleDropdown();
			}}
			disabled={isUpdating}
			class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all {getStatusColor(currentStatus.code)} {isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-500'}"
		>
			{#if isUpdating}
				<svg class="mr-1 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			{/if}
			{currentStatus.name}
			<svg class="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	{/if}
</div>
