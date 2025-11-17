/**
 * Server-side load function for projects page with SSR
 * Data is rendered on the server for SEO and better performance
 * Uses streaming to show loading state while data is being fetched
 * Requirements: Server-side data loading, error handling, authentication state management
 */

import { getProjectsWithPagination } from '$lib/api/projects.js';

/**
 * Error types for better error categorization
 */
const ERROR_TYPES = {
	NETWORK: 'network',
	API: 'api',
	AUTH: 'auth',
	TIMEOUT: 'timeout',
	VALIDATION: 'validation',
	UNKNOWN: 'unknown'
};

/**
 * Categorize error based on error message and properties
 * @param {Error} error - The error to categorize
 * @returns {string} Error type
 */
function categorizeError(error) {
	const message = error.message?.toLowerCase() || '';

	if (message.includes('network') || message.includes('fetch')) {
		return ERROR_TYPES.NETWORK;
	}
	if (message.includes('timeout') || message.includes('aborted')) {
		return ERROR_TYPES.TIMEOUT;
	}
	if (message.includes('unauthorized') || message.includes('forbidden')) {
		return ERROR_TYPES.AUTH;
	}
	if (message.includes('validation') || message.includes('invalid')) {
		return ERROR_TYPES.VALIDATION;
	}
	if (message.includes('graphql') || message.includes('api')) {
		return ERROR_TYPES.API;
	}

	return ERROR_TYPES.UNKNOWN;
}

/**
 * Get user-friendly error message based on error type
 * @param {string} errorType - Error type
 * @param {string} originalMessage - Original error message
 * @returns {string} User-friendly error message
 */
function getUserFriendlyErrorMessage(errorType, originalMessage) {
	switch (errorType) {
		case ERROR_TYPES.NETWORK:
			return 'Проблема с подключением к серверу. Проверьте интернет-соединение.';
		case ERROR_TYPES.TIMEOUT:
			return 'Превышено время ожидания ответа от сервера. Попробуйте еще раз.';
		case ERROR_TYPES.AUTH:
			return 'Ошибка авторизации. Пожалуйста, войдите в систему заново.';
		case ERROR_TYPES.API:
			return 'Ошибка при получении данных с сервера. Попробуйте обновить страницу.';
		case ERROR_TYPES.VALIDATION:
			return 'Получены некорректные данные с сервера. Обратитесь к администратору.';
		default:
			return `Произошла неожиданная ошибка: ${originalMessage}`;
	}
}

/**
 * Create fallback data structure for projects page
 * @returns {Object} Fallback data structure
 */
function createProjectsFallbackData() {
	return {
		projects: [],
		stats: {
			total: 0,
			active: 0,
			inactive: 0,
			totalContractAmount: 0,
			averageContractAmount: 0
		},
		pagination: {
			currentPage: 1,
			lastPage: 1,
			total: 0,
			perPage: 50,
			hasMorePages: false
		},
		error: null,
		errorType: null,
		canRetry: false,
		isLoading: false
	};
}

/**
 * Validate projects data structure
 * @param {any} projectsResult - Projects result from API
 * @returns {boolean} Whether data is valid
 */
function validateProjectsData(projectsResult) {
	if (!projectsResult || typeof projectsResult !== 'object') {
		return false;
	}

	if (!Array.isArray(projectsResult.data)) {
		return false;
	}

	// Validate pagination info structure
	const paginatorInfo = projectsResult.paginatorInfo;
	if (paginatorInfo && typeof paginatorInfo !== 'object') {
		return false;
	}

	return true;
}

/**
 * Safely calculate project statistics
 * @param {Array} projects - Array of projects
 * @returns {Object} Statistics object
 */
function calculateProjectStats(projects) {
	if (!Array.isArray(projects)) {
		return {
			total: 0,
			active: 0,
			inactive: 0,
			totalContractAmount: 0,
			averageContractAmount: 0
		};
	}

	const stats = {
		total: projects.length,
		active: 0,
		inactive: 0,
		totalContractAmount: 0,
		averageContractAmount: 0
	};

	for (const project of projects) {
		// Safely check project properties
		if (project?.is_active === true) {
			stats.active++;
		} else {
			stats.inactive++;
		}

		// Safely add contract amount
		const contractAmount = Number(project?.contract_amount) || 0;
		if (contractAmount > 0) {
			stats.totalContractAmount += contractAmount;
		}
	}

	// Calculate average contract amount
	if (stats.total > 0) {
		stats.averageContractAmount = stats.totalContractAmount / stats.total;
	}

	return stats;
}

/**
 * Load projects data asynchronously for streaming
 */
async function loadProjectsData(fetch) {
	const startTime = Date.now();

	try {
		// Add timeout to prevent hanging requests
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 seconds
		});

		// Load projects data - use SvelteKit fetch for proper SSR support
		// Load only first page (50 items) for initial render to avoid timeout
		const projectsResult = await Promise.race([
			getProjectsWithPagination(50, 1, fetch), // Pass SvelteKit fetch function
			timeoutPromise
		]);

		// Validate data structure
		if (!validateProjectsData(projectsResult)) {
			throw new Error('Invalid data format received from API');
		}

		const rawProjects = projectsResult.data || [];

		// Sort projects by created_at in descending order (newest first)
		const sortedProjects = [...rawProjects].sort((a, b) => {
			const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
			const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
			return dateB - dateA;
		});

		// Add sequential numbers to projects (1, 2, 3, ...)
		const projects = sortedProjects.map((project, index) => ({
			...project,
			sequentialNumber: index + 1
		}));

		// Calculate statistics with error handling
		const stats = calculateProjectStats(projects);

		// Ensure pagination info is valid
		const pagination = projectsResult.paginatorInfo || {
			currentPage: 1,
			lastPage: 1,
			total: projects.length,
			perPage: 50,
			hasMorePages: false
		};

		const loadTime = Date.now() - startTime;

		return {
			projects,
			stats,
			pagination,
			error: null,
			errorType: null,
			canRetry: false,
			isLoading: false,
			loadTime
		};
	} catch (apiError) {
		const errorType = categorizeError(apiError);
		const userMessage = getUserFriendlyErrorMessage(errorType, apiError.message);

		console.error('Failed to load projects data:', {
			error: apiError.message,
			type: errorType,
			stack: apiError.stack,
			loadTime: Date.now() - startTime
		});

		// Return error state with detailed information for graceful error handling
		const fallbackData = createProjectsFallbackData();
		return {
			...fallbackData,
			error: userMessage,
			errorType,
			canRetry: errorType !== ERROR_TYPES.AUTH, // Don't allow retry for auth errors
			originalError: apiError.message, // For debugging
			loadTime: Date.now() - startTime
		};
	}
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	// Return immediately with streamed Promise
	// Page will render instantly, data will load in background
	return {
		// Don't await - return Promise for streaming!
		projectsData: loadProjectsData(fetch)
	};
}
