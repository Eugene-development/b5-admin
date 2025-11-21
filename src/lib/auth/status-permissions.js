/**
 * Status-based permissions mapping for b5-admin
 * Maps user statuses to allowed routes and features
 */

/**
 * User status slugs from database
 */
export const USER_STATUSES = {
	NOT_DEFINED: 'not-defined',
	CLIENTS: 'clients',
	AGENTS: 'agents',
	DESIGNERS: 'designers',
	MANAGERS: 'managers',
	CURATORS: 'curators',
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
	ORDERS: '/orders',
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

	[USER_STATUSES.CURATORS]: {
		name: 'Куратор',
		description: 'Управление проектами, подрядчиками и поставщиками',
		routes: [
			ROUTES.PROJECTS,
			ROUTES.CONTRACTORS,
			ROUTES.SUPPLIERS,
			ROUTES.SERVICES,
			ROUTES.ACTIONS,
			ROUTES.ORDERS,
			ROUTES.TZ,
			ROUTES.BZ,
			ROUTES.DOCUMENTATION
		],
		canManageProjects: true,
		canManageCompanies: false,
		canManageFinances: false,
		canAccessReports: true
	},

	[USER_STATUSES.MANAGERS]: {
		name: 'Менеджер',
		description: 'Управление проектами и клиентами',
		routes: [
			ROUTES.PROJECTS,
			ROUTES.CLIENTS,
			ROUTES.ACTIONS,
			ROUTES.ORDERS,
			ROUTES.TZ,
			ROUTES.DOCUMENTATION
		],
		canManageProjects: true,
		canManageCompanies: false,
		canManageFinances: false,
		canAccessReports: false
	},

	[USER_STATUSES.AGENTS]: {
		name: 'Агент',
		description: 'Просмотр проектов и создание заявок',
		routes: [ROUTES.PROJECTS, ROUTES.ACTIONS, ROUTES.DOCUMENTATION],
		canManageProjects: false,
		canManageCompanies: false,
		canManageFinances: false,
		canAccessReports: false
	},

	[USER_STATUSES.DESIGNERS]: {
		name: 'Дизайнер',
		description: 'Работа с проектами и техническими заданиями',
		routes: [ROUTES.PROJECTS, ROUTES.TZ, ROUTES.ACTIONS],
		canManageProjects: false,
		canManageCompanies: false,
		canManageFinances: false,
		canAccessReports: false
	},

	[USER_STATUSES.CLIENTS]: {
		name: 'Клиент',
		description: 'Просмотр собственных проектов и заказов',
		routes: [ROUTES.PROJECTS, ROUTES.ORDERS, ROUTES.ACTIONS],
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
	// Public routes are accessible to everyone
	if (PUBLIC_ROUTES.includes(route)) {
		return true;
	}

	// Common routes are accessible to all authenticated users
	if (COMMON_ROUTES.includes(route)) {
		return true;
	}

	// Get user's permissions
	const permissions = STATUS_PERMISSIONS[userStatusSlug];

	if (!permissions) {
		// Unknown status - deny access
		return false;
	}

	// Admin has full access
	if (permissions.routes === '*') {
		return true;
	}

	// Check if route is in user's allowed routes
	return permissions.routes.includes(route);
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

	// Admin gets all routes
	if (permissions.routes === '*') {
		return Object.values(ROUTES);
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
