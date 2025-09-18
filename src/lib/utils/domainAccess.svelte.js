/**
 * Domain-based access control utilities for client-side UI
 * Provides reactive domain detection and access control for UI elements
 * Using Svelte 5 runes for reactivity
 */

import { browser } from '$app/environment';

/**
 * Reactive domain state
 */
export const domainState = $state({
	hostname: '',
	isAdminDomain: false,
	isRegularDomain: false,
	isLocalhost: false,
	initialized: false
});

/**
 * Initialize domain detection
 * Should be called once when the app starts (in browser environment)
 */
export function initializeDomainDetection() {
	if (!browser) return;
	
	const hostname = window.location.hostname;
	
	domainState.hostname = hostname;
	domainState.isAdminDomain = hostname === 'admin.bonus.band';
	domainState.isRegularDomain = hostname === 'bonus.band';
	domainState.isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
	domainState.initialized = true;
	
	console.log('🌐 Domain detection initialized:', {
		hostname,
		isAdminDomain: domainState.isAdminDomain,
		isRegularDomain: domainState.isRegularDomain,
		isLocalhost: domainState.isLocalhost
	});
}

/**
 * Check if current domain has access to admin-only features
 * @returns {boolean} True if current domain can access admin features
 */
export function hasAdminAccess() {
	if (!domainState.initialized) {
		// Fallback check if state not initialized
		if (browser) {
			const hostname = window.location.hostname;
			return hostname === 'admin.bonus.band' || hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
		}
		return false;
	}
	
	return domainState.isAdminDomain || domainState.isLocalhost;
}

/**
 * Check if a specific navigation item should be visible
 * @param {string} path - The navigation path to check
 * @returns {boolean} True if the navigation item should be visible
 */
export function shouldShowNavItem(path) {
	// Define admin-only navigation items
	const adminOnlyPaths = ['/test', '/test2'];
	
	// Check if this path requires admin access
	const requiresAdminAccess = adminOnlyPaths.some(adminPath => path.startsWith(adminPath));
	
	if (requiresAdminAccess) {
		return hasAdminAccess();
	}
	
	// All other navigation items are visible to everyone
	return true;
}

/**
 * Get domain-specific navigation configuration
 * @returns {Object} Navigation configuration object
 */
export function getNavigationConfig() {
	const showAdminItems = hasAdminAccess();
	
	return {
		showAdminItems,
		adminOnlyItems: ['/test', '/test2'],
		currentDomain: domainState.hostname,
		domainType: domainState.isAdminDomain ? 'admin' : 
		           domainState.isRegularDomain ? 'regular' : 
		           domainState.isLocalhost ? 'localhost' : 'unknown'
	};
}

/**
 * Get current navigation visibility state (non-reactive)
 * Returns the current value for navigation visibility
 * @returns {Object} Navigation visibility configuration
 */
export function getNavigationVisibility() {
	return {
		showTest: shouldShowNavItem('/test'),
		showTest2: shouldShowNavItem('/test2'),
		hasAdminAccess: hasAdminAccess(),
		config: getNavigationConfig()
	};
}

/**
 * Debug function to log current domain state
 * Useful for troubleshooting domain access issues
 */
export function debugDomainState() {
	console.log('🔍 Domain State Debug:', {
		...domainState,
		hasAdminAccess: hasAdminAccess(),
		navigationVisibility: {
			showTest: shouldShowNavItem('/test'),
			showTest2: shouldShowNavItem('/test2')
		}
	});
}