/**
 * Date utilities for projects
 */

/**
 * Get relative time description (e.g., "3 дня назад", "через 5 дней")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Relative time description
 */
export function getRelativeTime(dateString) {
	if (!dateString) {
		return '';
	}

	try {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = date.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return 'Сегодня';
		} else if (diffDays === 1) {
			return 'Завтра';
		} else if (diffDays === -1) {
			return 'Вчера';
		} else if (diffDays > 0) {
			return `Через ${diffDays} ${getDaysWord(diffDays)}`;
		} else {
			return `${Math.abs(diffDays)} ${getDaysWord(Math.abs(diffDays))} назад`;
		}
	} catch (error) {
		console.error('Error calculating relative time:', error);
		return '';
	}
}

/**
 * Get correct Russian word form for days
 * @param {number} days - Number of days
 * @returns {string} Correct word form
 */
function getDaysWord(days) {
	const lastDigit = days % 10;
	const lastTwoDigits = days % 100;

	if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
		return 'дней';
	}

	if (lastDigit === 1) {
		return 'день';
	}

	if (lastDigit >= 2 && lastDigit <= 4) {
		return 'дня';
	}

	return 'дней';
}

/**
 * Get urgency level for a date
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Urgency level: 'overdue', 'urgent', 'warning', 'normal'
 */
export function getDateUrgency(dateString) {
	if (!dateString) {
		return 'normal';
	}

	try {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = date.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays < 0) {
			return 'overdue';
		} else if (diffDays <= 3) {
			return 'urgent';
		} else if (diffDays <= 7) {
			return 'warning';
		} else {
			return 'normal';
		}
	} catch (error) {
		console.error('Error calculating date urgency:', error);
		return 'normal';
	}
}

/**
 * Get CSS classes based on date urgency
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} CSS classes for styling
 */
export function getDateUrgencyClasses(dateString) {
	const urgency = getDateUrgency(dateString);

	switch (urgency) {
		case 'overdue':
			return 'text-red-600 font-semibold bg-red-50 px-2 py-1 rounded';
		case 'urgent':
			return 'text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded';
		case 'warning':
			return 'text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded';
		default:
			return 'text-gray-900';
	}
}
