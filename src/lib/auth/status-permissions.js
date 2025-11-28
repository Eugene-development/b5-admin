/**
 * Status-based permissions mapping for b5-admin
 * Maps user statuses to allowed routes and features
 */

/**
 * User status slugs from database
 */
export const USER_STATUSES = {
	NOT_DEFINED: 'not-defined',
	CLIENT: 'client',
	AGENT: 'agent',
	DESIGNER: 'designer',
	MANAGER: 'manager',
	CURATOR: 'curator',
	ADMIN: 'admin'
};

/**
 * Route definitions - all routes in the application
 */
export const ROUTES = {
	// Public routes (accessible to all)
	HOME: '/',
	LOGIN: '/login',
	REGISTER: '/register',
	EMAIL_VERIFY: '/email-verify',
	HEALTH: '/health',

	// Protected routes
	DASHBOARD: '/dashboard',
	PROFILE: '/profile',
	SETTINGS: '/settings',

	// Entity management routes
	AGENTS: '/agents',
	CURATORS: '/curators',
	CONTRACTORS: '/contractors',
	SUPPLIERS: '/suppliers',
	SERVICES: '/services',
	CLIENTS: '/clients',
	DESIGNERS: '/designers',
	MANAGERS: '/managers',

	// Business routes
	PROJECTS: '/projects',
	ACTIONS: '/actions',
	ORDER: '/order',
	COMPLAINTS: '/complaints',
	CONTRACTS: '/contracts',

	// Technical routes
	TZ: '/tz', // Технические задания
	BZ: '/bz', // Бизнес задания
	DELIVERY: '/delivery',

	// Admin routes
	FINANCE: '/finance',
	DOCUMENTATION: '/documentation'
};

/**
 * Public routes - accessible without authentication
 */
export const PUBLIC_ROUTES = [
	ROUTES.HOME,
	ROUTES.LOGIN,
	ROUTES.REGISTER,
	ROUTES.EMAIL_VERIFY,
	ROUTES.HEALTH
];

/**
 * Common routes - accessible to all authenticated users
 */
export const COMMON_ROUTES = [ROUTES.HOME, ROUTES.DASHBOARD, ROUTES.PROFILE, ROUTES.SETTINGS];

/**
 * Status permissions mapping - defines which routes each status can access
 * Routes listed here are IN ADDITION to COMMON_ROUTES
 */
export const STATUS_PERMISSIONS = {
	[USER_STATUSES.ADMIN]: {
		name: 'Админ',
		description: 'Полный доступ ко всем функциям системы',
		routes: '*', // Special marker for full access
		canManageUsers: true,
		canManageCompanies: true,
		canManageProjects: true,
		canManageFinances: true,
		canAccessReports: true
	},

	[USER_STATUSES.CURATOR]: {
		name: 'Куратор',
		description: 'Полный доступ ко всем страницам, кроме Агентов и Доставки',
		routes: '*', // Full access
		excludeRoutes: [ROUTES.AGENTS, ROUTES.DELIVERY], // Except these routes
		canManageProjects: true,
		canManageCompanies: false,
		canManageFinances: false,
		canAccessReports: true
	},

	[USER_STATUSES.MANAGER]: {
		name: 'Менеджер',
		description: 'Управление проектами и клиентами',
		routes: [
			ROUTES.PROJECTS,
			ROUTES.CLIENTS,
			ROUTES.ACTIONS,
			ROUTES.ORDER,
			ROUTES.TZ,
			ROUTES.DOCUMENTATION
		],
		canManageProjects: true,
		canManageCompanies: false,
		canManageFinances: false,
		canAccessReports: false
	},

	[USER_STATUSES.AGENT]: {
		name: 'Агент',
		description: 'Нет доступа к административной панели',
		routes: [], // No access to any routes
		canManageProjects: false,
		canManageCompanies: false,
		canManageFinances: false,
		canAccessReports: false
	},

	[USER_STATUSES.DESIGNER]: {
		name: 'Дизайнер',
		description: 'Работа с проектами и техническими заданиями',
		routes: [ROUTES.PROJECTS, ROUTES.TZ, ROUTES.ACTIONS],
		canManageProjects: false,
		canManageCompanies: false,
		canManageFinances: false,
		canAccessReports: false
	},

	[USER_STATUSES.CLIENT]: {
		name: 'Клиент',
		description: 'Нет доступа к административной панели',
		routes: [], // No access to any routes
		canManageProjects: false,
		canManageCompanies: false,
		canManageFinances: false,
		canAccessReports: false
	},

	[USER_STATUSES.NOT_DEFINED]: {
		name: 'Не определено',
		description: 'Минимальный доступ к системе',
		routes: [], // Only COMMON_ROUTES
		canManageProjects: false,
		canManageCompanies: false,
		canManageFinances: false,
		canAccessReports: false
	}
};

/**
 * Check if user has access to a specific route based on their status
 * @param {string} userStatusSlug - User's status slug (e.g., 'admin', 'curators')
 * @param {string} route - Route path to check (e.g., '/projects')
 * @returns {boolean} True if user has access to the route
 */
export function hasRouteAccess(userStatusSlug, route) {
	// Debug logging for curator
	const isDebug = userStatusSlug === 'curator';
	if (isDebug) {
		console.log('🔍 hasRouteAccess Debug:', { userStatusSlug, route });
	}

	// Public routes are accessible to everyone
	if (PUBLIC_ROUTES.includes(route)) {
		if (isDebug) console.log('✅ Public route - access granted');
		return true;
	}

	// Agents and Clients have NO access to any protected routes (including dashboard)
	if (userStatusSlug === USER_STATUSES.AGENT || userStatusSlug === USER_STATUSES.CLIENT) {
		console.log('🚫 Agent/Client status - access denied to all protected routes');
		return false;
	}

	// Common routes are accessible to all authenticated users (except agents and clients)
	if (COMMON_ROUTES.includes(route)) {
		if (isDebug) console.log('✅ Common route - access granted');
		return true;
	}

	// Get user's permissions
	const permissions = STATUS_PERMISSIONS[userStatusSlug];

	if (!permissions) {
		// Unknown status - deny access
		if (isDebug) console.log('❌ Unknown status - access denied');
		return false;
	}

	if (isDebug) {
		console.log('📋 Permissions:', {
			routes: permissions.routes,
			excludeRoutes: permissions.excludeRoutes
		});
	}

	// Check for full access with exclusions
	if (permissions.routes === '*') {
		// If there are excluded routes, check if current route is excluded
		if (permissions.excludeRoutes && Array.isArray(permissions.excludeRoutes)) {
			// Check if route is in excluded routes
			const isExcluded = permissions.excludeRoutes.includes(route);
			if (isDebug) {
				console.log('🔍 Checking exclusions:', {
					route,
					excludeRoutes: permissions.excludeRoutes,
					isExcluded,
					result: !isExcluded
				});
			}
			return !isExcluded;
		}
		// Full access without exclusions
		if (isDebug) console.log('✅ Full access without exclusions');
		return true;
	}

	// Check if route is in user's allowed routes
	const hasAccess = permissions.routes.includes(route);
	if (isDebug) {
		console.log('🔍 Checking allowed routes:', {
			route,
			allowedRoutes: permissions.routes,
			hasAccess
		});
	}
	return hasAccess;
}

/**
 * Get all allowed routes for a user based on their status
 * @param {string} userStatusSlug - User's status slug
 * @returns {Array<string>} Array of allowed route paths
 */
export function getAllowedRoutes(userStatusSlug) {
	const permissions = STATUS_PERMISSIONS[userStatusSlug];

	if (!permissions) {
		return [...PUBLIC_ROUTES, ...COMMON_ROUTES];
	}

	// Agents and Clients have NO access to any protected routes
	if (userStatusSlug === USER_STATUSES.AGENT || userStatusSlug === USER_STATUSES.CLIENT) {
		return [...PUBLIC_ROUTES]; // Only public routes (login, register, etc.)
	}

	// Full access (possibly with exclusions)
	if (permissions.routes === '*') {
		const allRoutes = Object.values(ROUTES);

		// If there are excluded routes, filter them out
		if (permissions.excludeRoutes && Array.isArray(permissions.excludeRoutes)) {
			return allRoutes.filter((route) => !permissions.excludeRoutes.includes(route));
		}

		// Full access without exclusions
		return allRoutes;
	}

	// Return common routes + status-specific routes
	return [...PUBLIC_ROUTES, ...COMMON_ROUTES, ...permissions.routes];
}

/**
 * Check if user has a specific permission
 * @param {string} userStatusSlug - User's status slug
 * @param {string} permission - Permission key (e.g., 'canManageProjects')
 * @returns {boolean} True if user has the permission
 */
export function hasPermission(userStatusSlug, permission) {
	const permissions = STATUS_PERMISSIONS[userStatusSlug];

	if (!permissions) {
		return false;
	}

	return !!permissions[permission];
}

/**
 * Get user's status permissions object
 * @param {string} userStatusSlug - User's status slug
 * @returns {Object|null} Permissions object or null if status not found
 */
export function getStatusPermissions(userStatusSlug) {
	return STATUS_PERMISSIONS[userStatusSlug] || null;
}

/**
 * Get human-readable status name
 * @param {string} userStatusSlug - User's status slug
 * @returns {string} Status name or 'Unknown'
 */
export function getStatusName(userStatusSlug) {
	const permissions = STATUS_PERMISSIONS[userStatusSlug];
	return permissions?.name || 'Unknown';
}
