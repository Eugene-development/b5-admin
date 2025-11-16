/**
 * Utility functions for adding sequential numbers to data items
 */

/**
 * Add sequential numbers to items based on created_at date
 * Sorts items by created_at descending (newest first) and adds sequentialNumber field
 * @param {Array} items - Array of items to process
 * @returns {Array} Items with sequentialNumber added
 */
export function addSequentialNumbers(items) {
	if (!Array.isArray(items) || items.length === 0) {
		return items;
	}

	// Sort items by created_at in descending order (newest first)
	const sortedItems = [...items].sort((a, b) => {
		const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
		const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
		return dateB - dateA;
	});

	// Add sequential numbers (1, 2, 3, ...)
	return sortedItems.map((item, index) => ({
		...item,
		sequentialNumber: index + 1
	}));
}

/**
 * Preserve sequential numbers when updating items
 * @param {Array} currentItems - Current items with sequentialNumber
 * @param {Array} updatedItems - Updated items to merge
 * @returns {Array} Updated items with preserved sequentialNumbers
 */
export function preserveSequentialNumbers(currentItems, updatedItems) {
	if (!Array.isArray(currentItems) || !Array.isArray(updatedItems)) {
		return updatedItems;
	}

	// Create a map of current items for quick lookup
	const sequentialMap = new Map(currentItems.map((item) => [item.id, item.sequentialNumber]));

	// Preserve sequential numbers for existing items
	return updatedItems.map((item) => ({
		...item,
		sequentialNumber: sequentialMap.get(item.id) || item.sequentialNumber
	}));
}

/**
 * Recalculate sequential numbers after deletion or addition
 * @param {Array} items - Array of items
 * @returns {Array} Items with recalculated sequentialNumbers
 */
export function recalculateSequentialNumbers(items) {
	if (!Array.isArray(items)) {
		return items;
	}

	return items.map((item, index) => ({
		...item,
		sequentialNumber: index + 1
	}));
}
