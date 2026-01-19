<script>
	import {
		updateContractPartnerPaymentStatus,
		updateOrderPartnerPaymentStatus
	} from '$lib/api/finances.js';
	import { addSuccessToast } from '$lib/utils/toastStore.js';
	import { onMount, onDestroy } from 'svelte';

	let {
		sourceEntity,
		sourceType = 'contract',
		partnerPaymentStatuses = [],
		onStatusChange = null
	} = $props();

	let isUpdating = $state(false);
	let showDropdown = $state(false);
	let buttonRef = $state(null);
	let portalContainer = null;

	// Get current status
	let currentStatus = $derived(
		sourceEntity?.partnerPaymentStatus || { code: 'pending', name: 'Ожидает оплаты' }
	);

	// Get payment date
	function getPaymentDate() {
		return sourceEntity?.partner_payment_date || null;
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
			case 'pending':
			default:
				return 'bg-gray-400 dark:bg-gray-500';
		}
	}

	// Create portal container on mount
	onMount(() => {
		portalContainer = document.createElement('div');
		portalContainer.id = `partner-payment-dropdown-portal-${sourceEntity?.id || Math.random().toString(36).substr(2, 9)}`;
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
		const dropdownHeight = 100;
		const viewportHeight = window.innerHeight;
		const spaceBelow = viewportHeight - rect.bottom;
		const spaceAbove = rect.top;
		const openUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

		const topStyle = openUp
			? `bottom: ${window.innerHeight - rect.top + 4}px`
			: `top: ${rect.bottom + 4}px`;

		portalContainer.innerHTML = `
			<div 
				class="fixed z-[9999] w-40 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700"
				style="${topStyle}; left: ${rect.left}px;"
			>
				<div class="py-1">
					${partnerPaymentStatuses
						.map(
							(status) => `
						<button
							type="button"
							data-status-code="${status.code}"
							class="flex w-full items-center px-4 py-2 text-left text-sm ${status.code === currentStatus.code ? 'bg-gray-100 dark:bg-gray-600' : 'hover:bg-gray-50 dark:hover:bg-gray-600'} text-gray-700 dark:text-gray-200"
						>
							<span class="mr-2 h-2 w-2 rounded-full ${status.code === 'paid' ? 'bg-green-500' : 'bg-gray-400'}"></span>
							${status.name}
							${
								status.code === currentStatus.code
									? `
								<svg class="ml-auto h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							`
									: ''
							}
						</button>
					`
						)
						.join('')}
				</div>
			</div>
		`;

		// Add click handlers
		portalContainer.querySelectorAll('button[data-status-code]').forEach((btn) => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				const code = btn.getAttribute('data-status-code');
				handleStatusChange(code);
			});
		});
	}

	// Handle status change
	async function handleStatusChange(newStatusCode) {
		if (isUpdating || newStatusCode === currentStatus.code || !sourceEntity) {
			showDropdown = false;
			clearDropdown();
			return;
		}

		isUpdating = true;
		showDropdown = false;
		clearDropdown();

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
		}
	}

	// Close dropdown on outside click
	function handleClickOutside(event) {
		if (
			showDropdown &&
			!event.target.closest('.payment-indicator-container') &&
			!event.target.closest('[data-status-code]')
		) {
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

<div class="payment-indicator-container relative inline-block">
	{#if !sourceEntity}
		<span class="text-gray-400">—</span>
	{:else}
		<!-- Clickable colored rectangle with tooltip -->
		<div class="group relative inline-flex items-center justify-center">
			<button
				bind:this={buttonRef}
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					toggleDropdown();
				}}
				disabled={isUpdating}
				class="h-4 w-8 rounded transition-all {getStatusBgColor(currentStatus.code)} {isUpdating
					? 'cursor-wait opacity-50'
					: 'cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:ring-offset-1'}"
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
				<div
					class="whitespace-nowrap rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-700"
				>
					{formatDate(getPaymentDate())}
				</div>
				<!-- Arrow -->
				<div class="absolute left-1/2 top-full -translate-x-1/2 transform">
					<div class="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
				</div>
			</div>
		</div>
	{/if}
</div>
