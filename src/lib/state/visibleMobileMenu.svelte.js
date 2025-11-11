/**
 * Mobile menu visibility state
 * Using Svelte 5's $state for reactive state management
 */
let isOpen = $state(false);

export const visibleMobileMenu = {
	get value() {
		return isOpen;
	},
	set value(val) {
		isOpen = val;
	}
};

/**
 * Helper function to toggle mobile menu
 */
export function toggleMobileMenu() {
	isOpen = !isOpen;
}

/**
 * Helper function to close mobile menu
 */
export function closeMobileMenu() {
	isOpen = false;
}

/**
 * Helper function to open mobile menu
 */
export function openMobileMenu() {
	isOpen = true;
}
