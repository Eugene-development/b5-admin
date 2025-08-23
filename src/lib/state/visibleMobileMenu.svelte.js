/**
 * Mobile menu visibility state
 * Using Svelte 5's $state for reactive state management
 */
export const visibleMobileMenu = $state({
	value: false
});

/**
 * Helper function to toggle mobile menu
 */
export function toggleMobileMenu() {
	visibleMobileMenu.value = !visibleMobileMenu.value;
}

/**
 * Helper function to close mobile menu
 */
export function closeMobileMenu() {
	visibleMobileMenu.value = false;
}

/**
 * Helper function to open mobile menu
 */
export function openMobileMenu() {
	visibleMobileMenu.value = true;
}

