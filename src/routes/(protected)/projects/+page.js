/**
 * Client-side load function for projects page
 * Handles data fetching and processing with error handling on the client-side
 * Uses client-side loading to match the project's authentication pattern
 * Requirements: Client-side data loading, error handling, authentication state management
 */

import { getProjectsWithPagination } from '$lib/api/projects.js';
import { authState } from '$lib/auth/auth.svelte.js';
import { browser } from '$app/environment';

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
			perPage: 1000,
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

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const startTime = Date.now();
	
	// Check if we're in browser - for SSR safety
	if (!browser) {
		// Return fallback data for SSR
		return createProjectsFallbackData();
	}

	// Since auth is handled client-side and the check might not be ready yet,
	// we'll proceed with the API call and let the API handle authentication errors
	try {
		// Add timeout to prevent hanging requests
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 seconds
		});

		// Load projects data - use window.fetch for client-side loading
		console.log('🔍 About to call getProjectsWithPagination without custom fetch');
		const projectsResult = await Promise.race([
			getProjectsWithPagination(1000, 1), // Use default fetch (no custom fetch)
			timeoutPromise
		]);
		console.log('✅ getProjectsWithPagination completed successfully:', projectsResult);

		// Validate data structure
		if (!validateProjectsData(projectsResult)) {
			throw new Error('Invalid data format received from API');
		}

		const projects = projectsResult.data || [];

		// Calculate statistics with error handling
		const stats = calculateProjectStats(projects);

		// Ensure pagination info is valid
		const pagination = projectsResult.paginatorInfo || {
			currentPage: 1,
			lastPage: 1,
			total: projects.length,
			perPage: 1000,
			hasMorePages: false
		};

		const loadTime = Date.now() - startTime;
		console.log(`Projects data loaded successfully in ${loadTime}ms`);

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