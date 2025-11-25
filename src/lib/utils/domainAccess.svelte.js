/**
 * Domain-based access control utilities for client-side UI
 * Provides reactive domain detection and access control for UI elements
 * Using Svelte 5 runes for reactivity
 * 
 * Allowed domains:
 * - admin.bonus.band - full access
 * - rubonus.pro - full access
 * - localhost - full access (development)
 */

import { browser } from '$app/environment';

/**
 * Reactive domain state
 */
export const domainState = $state({
	hostname: '',
	isAdminDomain: false,
	isRubonusProDomain: false,
	isLocalhost: false,
	isAllowedDomain: false,
	initialized: false
});

/**
 * Initialize domain detection
 * Should be called once when the app starts (in browser environment)
 */
export function initializeDomainDetection() {
	if (!browser) return;

	// Skip if already initialized
	if (domainState.initialized) return;

	const hostname = window.location.hostname;

	domainState.hostname = hostname;
	domainState.isAdminDomain = hostname === 'admin.bonus.band';
	domainState.isRubonusProDomain = hostname === 'rubonus.pro';
	domainState.isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
	domainState.isAllowedDomain = domainState.isAdminDomain || domainState.isRubonusProDomain || domainState.isLocalhost;
	domainState.initialized = true;

	console.log('🌐 Domain detection initialized:', {
		hostname,
		isAdminDomain: domainState.isAdminDomain,
		isRubonusProDomain: domainState.isRubonusProDomain,
		isLocalhost: domainState.isLocalhost,
		isAllowedDomain: domainState.isAllowedDomain
	});
}

/**
 * Check if current domain is allowed to access the application
 * @returns {boolean} True if current domain is allowed
 */
export function isAllowedDomain() {
	if (!domainState.initialized) {
		// Fallback check if state not initialized
		if (browser) {
			const hostname = window.location.hostname;
			return (
				hostname === 'admin.bonus.band' ||
				hostname === 'rubonus.pro' ||
				hostname.startsWith('localhost') ||
				hostname.startsWith('127.0.0.1')
			);
		}
		return false;
	}

	return domainState.isAllowedDomain;
}

/**
 * Check if current domain has access to admin-only features
 * Currently all allowed domains have full access
 * @returns {boolean} True if current domain can access admin features
 */
export function hasAdminAccess() {
	return isAllowedDomain();
}

/**
 * Check if current domain has access to order page
 * Currently all allowed domains have full access
 * @returns {boolean} True if current domain can access order page
 */
export function hasOrderAccess() {
	return isAllowedDomain();
}

/**
 * Full access pages list - all allowed domains have access to all pages
 */
const FULL_ACCESS_PAGES = [
	'/agents',
	'/curators',
	'/managers',
	'/designers',
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
	'/documentation',
	'/order',
	'/complaints'
];

/**
 * Get domain-specific page configurations
 * Currently all allowed domains have full access to all pages
 */
export function getDomainPageConfig() {
	return {
		'admin.bonus.band': FULL_ACCESS_PAGES,
		'rubonus.pro': FULL_ACCESS_PAGES,
		localhost: FULL_ACCESS_PAGES
	};
}

/**
 * Check if a specific navigation item should be visible for current domain
 * @param {string} path - The navigation path to check
 * @returns {boolean} True if the navigation item should be visible
 */
export function shouldShowNavItem(path) {
	// Note: Domain detection should be initialized in root layout before this is called
	// We don't initialize here to avoid state mutation in $derived contexts
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
	const allowedPages = pageConfig[hostname] || pageConfig['localhost'] || [];

	return {
		currentDomain: hostname,
		allowedPages,
		domainType: domainState.isAdminDomain
			? 'admin.bonus.band'
			: domainState.isRubonusProDomain
				? 'rubonus.pro'
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
		showManagers: shouldShowNavItem('/managers'),
		showDesigners: shouldShowNavItem('/designers'),
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
		showOrder: hasOrderAccess(),

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
