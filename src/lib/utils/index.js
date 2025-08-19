// Export all formatting utilities
export * from './formatters.js';
export * from './dateUtils.js';

// Re-export commonly used functions with shorter names
export { 
	formatCurrency as currency,
	formatDate as date,
	formatAgentRate as agentRate,
	truncateText as truncate,
	isOverdue as overdue
} from './formatters.js';

export {
	getDateUrgency as urgency,
	getRelativeTime as relative
} from './dateUtils.js';