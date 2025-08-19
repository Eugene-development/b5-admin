/**
 * Formatting utilities for projects data
 */

/**
 * Format currency amount with Russian locale
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency code (default: RUB)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'RUB') {
	if (amount === null || amount === undefined || amount === '') {
		return 'Не указано';
	}
	
	const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
	
	if (isNaN(numAmount)) {
		return 'Не указано';
	}
	
	return new Intl.NumberFormat('ru-RU', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(numAmount);
}

/**
 * Format agent rate based on type (percentage or fixed amount)
 * @param {number|string} rate - Rate value
 * @param {string} type - Rate type: 'percentage' or 'fixed'
 * @returns {string} Formatted rate string
 */
export function formatAgentRate(rate, type = 'percentage') {
	if (rate === null || rate === undefined || rate === '') {
		return 'Не указано';
	}
	
	const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
	
	if (isNaN(numRate)) {
		return 'Не указано';
	}
	
	if (type === 'percentage') {
		return `${numRate}%`;
	}
	
	return formatCurrency(numRate);
}
/**

 * Format date to DD.MM.YYYY format
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
	if (!dateString) {
		return 'Не указано';
	}
	
	try {
		const date = new Date(dateString);
		
		// Check if date is valid
		if (isNaN(date.getTime())) {
			return 'Не указано';
		}
		
		return date.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	} catch (error) {
		console.error('Error formatting date:', error);
		return 'Не указано';
	}
}

/**
 * Check if a date is overdue (past current date)
 * @param {string|Date} dateString - Date string or Date object
 * @returns {boolean} True if date is overdue
 */
export function isOverdue(dateString) {
	if (!dateString) {
		return false;
	}
	
	try {
		const date = new Date(dateString);
		const today = new Date();
		
		// Reset time to compare only dates
		today.setHours(0, 0, 0, 0);
		date.setHours(0, 0, 0, 0);
		
		return date < today;
	} catch (error) {
		console.error('Error checking overdue date:', error);
		return false;
	}
}

/**
 * Truncate text to specified length and add ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength = 100) {
	if (!text || typeof text !== 'string') {
		return 'Описание не указано';
	}
	
	if (text.length <= maxLength) {
		return text;
	}
	
	return text.substring(0, maxLength) + '...';
}

/**
 * Check if text was truncated
 * @param {string} text - Original text
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {boolean} True if text was truncated
 */
export function isTruncated(text, maxLength = 100) {
	if (!text || typeof text !== 'string') {
		return false;
	}
	
	return text.length > maxLength;
}

/**
 * Get CSS classes for overdue date styling
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} CSS classes for styling
 */
export function getOverdueDateClasses(dateString) {
	if (isOverdue(dateString)) {
		return 'text-red-600 font-medium';
	}
	return 'text-gray-900';
}

/**
 * Format agent display name
 * @param {Object} agent - Agent object with name and email
 * @returns {string} Formatted agent display string
 */
export function formatAgentDisplay(agent) {
	if (!agent) {
		return 'Не назначен';
	}
	
	if (agent.name && agent.email) {
		return `${agent.name} (${agent.email})`;
	}
	
	if (agent.email) {
		return agent.email;
	}
	
	if (agent.name) {
		return agent.name;
	}
	
	return `ID: ${agent.id || 'Неизвестно'}`;
}