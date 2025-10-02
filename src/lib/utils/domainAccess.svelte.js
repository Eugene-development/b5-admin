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
	isRubonusDomain: false,
	isDRubonusDomain: false,
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
	domainState.isRubonusDomain = hostname === 'rubonus.info';
	domainState.isDRubonusDomain = hostname === 'd.rubonus.info';
	domainState.isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
	domainState.initialized = true;

	console.log('🌐 Domain detection initialized:', {
		hostname,
		isAdminDomain: domainState.isAdminDomain,
		isRegularDomain: domainState.isRegularDomain,
		isRubonusDomain: domainState.isRubonusDomain,
		isDRubonusDomain: domainState.isDRubonusDomain,
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
			return (
				hostname === 'admin.bonus.band' ||
				hostname.startsWith('localhost') ||
				hostname.startsWith('127.0.0.1')
			);
		}
		return false;
	}

	return domainState.isAdminDomain || domainState.isLocalhost;
}

/**
 * Get domain-specific page configurations
 */
export function getDomainPageConfig() {
	return {
		'rubonus.info': ['/actions', '/tz', '/projects'],
		'bonus.band': [
			'/projects',
			'/actions',
			'/contractors',
			'/suppliers',
			'/delivery',
			'/services',
			'/tz',
			'/bz',
			'/finance',
			'/documentation'
		],
		'd.rubonus.info': ['/bz', '/suppliers'],
		'admin.bonus.band': [
			'/agents',
			'/curators',
			'/contractors',
			'/suppliers',
			'/delivery',
			'/services',
			'/clients',
			'/projects',
			'/finance',
			'/tz',
			'/bz',
			'/actions',
			'/documentation'
		],
		localhost: [
			'/agents',
			'/curators',
			'/contractors',
			'/suppliers',
			'/delivery',
			'/services',
			'/clients',
			'/projects',
			'/finance',
			'/tz',
			'/bz',
			'/actions',
			'/documentation'
		] // For development
	};
}

/**
 * Check if a specific navigation item should be visible for current domain
 * @param {string} path - The navigation path to check
 * @returns {boolean} True if the navigation item should be visible
 */
export function shouldShowNavItem(path) {
	if (!domainState.initialized && browser) {
		// Fallback initialization if needed
		initializeDomainDetection();
	}

	const hostname = domainState.hostname;
	const pageConfig = getDomainPageConfig();

	// Common pages for all domains
	const commonPages = ['/dashboard', '/profile', '/settings'];
	if (commonPages.some((commonPath) => path.startsWith(commonPath))) {
		return true;
	}

	// Check localhost for development
	if (domainState.isLocalhost) {
		return pageConfig['localhost']?.some((allowedPath) => path.startsWith(allowedPath)) || false;
	}

	// Check specific domain pages
	const allowedPages = pageConfig[hostname] || [];
	return allowedPages.some((allowedPath) => path.startsWith(allowedPath));
}

/**
 * Get domain-specific navigation configuration
 * @returns {Object} Navigation configuration object
 */
export function getNavigationConfig() {
	const hostname = domainState.hostname;
	const pageConfig = getDomainPageConfig();
	const allowedPages = pageConfig[hostname] || [];

	return {
		currentDomain: hostname,
		allowedPages,
		domainType: domainState.isAdminDomain
			? 'admin'
			: domainState.isRegularDomain
				? 'bonus.band'
				: domainState.isRubonusDomain
					? 'rubonus.info'
					: domainState.isDRubonusDomain
						? 'd.rubonus.info'
						: domainState.isLocalhost
							? 'localhost'
							: 'unknown'
	};
}

/**
 * Get current navigation visibility state (non-reactive)
 * Returns the current value for navigation visibility
 * @returns {Object} Navigation visibility configuration
 */
export function getNavigationVisibility() {
	const config = getNavigationConfig();

	return {
		// Main navigation sections
		showAgents: shouldShowNavItem('/agents'),
		showCurators: shouldShowNavItem('/curators'),
		showContractors: shouldShowNavItem('/contractors'),
		showSuppliers: shouldShowNavItem('/suppliers'),
		showDelivery: shouldShowNavItem('/delivery'),
		showServices: shouldShowNavItem('/services'),

		// Analytics section
		showClients: shouldShowNavItem('/clients'),
		showProjects: shouldShowNavItem('/projects'),
		showFinance: shouldShowNavItem('/finance'),

		// Additional pages
		showActions: shouldShowNavItem('/actions'),
		showTz: shouldShowNavItem('/tz'),
		showBz: shouldShowNavItem('/bz'),
		showDocumentation: shouldShowNavItem('/documentation'),

		// Legacy admin access and config
		hasAdminAccess: hasAdminAccess(),
		config
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
		navigationVisibility: getNavigationVisibility()
	});
}
