/**
 * Status-based access control utilities for client-side UI
 * Provides reactive domain detection and status-based access control for UI elements
 * Using Svelte 5 runes for reactivity
 *
 * Allowed domains:
 * - admin.bonus.band - full access for admin users
 * - rubonus.pro - full access for admin users
 * - localhost - full access for admin users (development)
 */

import { browser } from '$app/environment';
import { getCurrentUserData } from '../state/auth.svelte.js';
import { hasRouteAccess, getAllowedRoutes, USER_STATUSES } from '../auth/status-permissions.js';

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
	domainState.isAllowedDomain =
		domainState.isAdminDomain || domainState.isRubonusProDomain || domainState.isLocalhost;
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
 * Get current user's status slug
 * @returns {string|null} User status slug or null if not authenticated
 */
function getUserStatusSlug() {
	const user = getCurrentUserData();
	return user?.status?.slug || null;
}

/**
 * Check if current user has access to admin-only features
 * Based on user status, not domain
 * @returns {boolean} True if user has admin status
 */
export function hasAdminAccess() {
	const statusSlug = getUserStatusSlug();
	return statusSlug === USER_STATUSES.ADMIN;
}

/**
 * Check if current user has access to order page
 * Based on user status permissions
 * @returns {boolean} True if user can access order page
 */
export function hasOrderAccess() {
	const statusSlug = getUserStatusSlug();
	if (!statusSlug) return false;
	return hasRouteAccess(statusSlug, '/order');
}

/**
 * Check if a specific navigation item should be visible based on user status
 * @param {string} path - The navigation path to check
 * @returns {boolean} True if the navigation item should be visible
 */
export function shouldShowNavItem(path) {
	const statusSlug = getUserStatusSlug();
	if (!statusSlug) return false;

	// Check if user has access to this route based on their status
	return hasRouteAccess(statusSlug, path);
}

/**
 * Get user status-based navigation configuration
 * @returns {Object} Navigation configuration object
 */
export function getNavigationConfig() {
	const statusSlug = getUserStatusSlug();
	const allowedRoutes = statusSlug ? getAllowedRoutes(statusSlug) : [];
	const user = getCurrentUserData();

	return {
		currentDomain: domainState.hostname,
		userStatus: statusSlug,
		userName: user?.name || 'Guest',
		allowedRoutes,
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
 * Returns the current value for navigation visibility based on user status
 * @returns {Object} Navigation visibility configuration
 */
export function getNavigationVisibility() {
	const config = getNavigationConfig();
	const statusSlug = getUserStatusSlug();

	// If no user status, hide all navigation items
	if (!statusSlug) {
		return {
			showAgents: false,
			showCurators: false,
			showManagers: false,
			showDesigners: false,
			showContractors: false,
			showSuppliers: false,
			showDelivery: false,
			showServices: false,
			showClients: false,
			showProjects: false,
			showFinance: false,
			showActions: false,
			showTz: false,
			showBz: false,
			showDocumentation: false,
			showOrder: false,
			hasAdminAccess: false,
			config
		};
	}

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

		// Admin access and config
		hasAdminAccess: hasAdminAccess(),
		config
	};
}

/**
 * Debug function to log current domain and user status state
 * Useful for troubleshooting access control issues
 */
export function debugDomainState() {
	const user = getCurrentUserData();
	console.log('🔍 Access Control Debug:', {
		domain: domainState,
		user: {
			name: user?.name,
			email: user?.email,
			status: user?.status
		},
		hasAdminAccess: hasAdminAccess(),
		navigationVisibility: getNavigationVisibility()
	});
}
