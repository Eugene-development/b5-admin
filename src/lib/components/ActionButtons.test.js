import { render } from '@testing-library/svelte';
import { vi } from 'vitest';
import ActionButtons from './ActionButtons.svelte';

describe('ActionButtons Component', () => {
	const mockAgent = {
		id: '1',
		name: 'Test Agent',
		email: 'test@example.com',
		status: 'active'
	};

	const mockBannedAgent = {
		id: '2',
		name: 'Banned Agent',
		email: 'banned@example.com',
		status: 'banned'
	};

	let mockOnBan, mockOnDelete;

	beforeEach(() => {
		mockOnBan = vi.fn();
		mockOnDelete = vi.fn();
		vi.clearAllMocks();
	});

	describe('Desktop Layout (default)', () => {
		test('renders ban and delete buttons for active agent', () => {
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			expect(screen.getByRole('button', { name: /Ban Test Agent/i })).toBeInTheDocument();
			expect(
				screen.getByRole('button', { name: /Delete Test Agent permanently/i })
			).toBeInTheDocument();
		});

		test('renders unban button for banned agent', () => {
			render(ActionButtons, {
				props: {
					agent: mockBannedAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			expect(screen.getByRole('button', { name: /Unban Banned Agent/i })).toBeInTheDocument();
			expect(screen.getByText('Разбанить')).toBeInTheDocument();
		});

		test('calls onBan when ban button is clicked', async () => {
			const user = userEvent.setup();
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			const banButton = screen.getByRole('button', { name: /Ban Test Agent/i });
			await user.click(banButton);

			expect(mockOnBan).toHaveBeenCalledWith(mockAgent);
		});

		test('calls onDelete when delete button is clicked', async () => {
			const user = userEvent.setup();
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			const deleteButton = screen.getByRole('button', { name: /Delete Test Agent permanently/i });
			await user.click(deleteButton);

			expect(mockOnDelete).toHaveBeenCalledWith(mockAgent);
		});

		test('disables buttons when loading', () => {
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete,
					isLoading: true
				}
			});

			const banButton = screen.getByRole('button', { name: /Ban Test Agent/i });
			const deleteButton = screen.getByRole('button', { name: /Delete Test Agent permanently/i });

			expect(banButton).toBeDisabled();
			expect(deleteButton).toBeDisabled();
		});

		test('shows loading spinner when loading', () => {
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete,
					isLoading: true
				}
			});

			// Check for loading spinners (they have aria-hidden="true")
			const spinners = screen.getAllByRole('img', { hidden: true });
			expect(spinners).toHaveLength(2); // One for each button
		});
	});

	describe('Mobile Layout', () => {
		test('renders mobile layout with full-width buttons', () => {
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete,
					mobile: true
				}
			});

			const banButton = screen.getByRole('button', { name: /Ban Test Agent/i });
			const deleteButton = screen.getByRole('button', { name: /Delete Test Agent permanently/i });

			expect(banButton).toBeInTheDocument();
			expect(deleteButton).toBeInTheDocument();

			// Check for mobile-specific text
			expect(screen.getByText('Забанить')).toBeInTheDocument();
			expect(screen.getByText('Удалить')).toBeInTheDocument();
		});

		test('renders unban button in mobile layout', () => {
			render(ActionButtons, {
				props: {
					agent: mockBannedAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete,
					mobile: true
				}
			});

			expect(screen.getByText('Разбанить')).toBeInTheDocument();
		});
	});

	describe('Compact Layout', () => {
		test('renders compact layout with smaller buttons', () => {
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete,
					compact: true
				}
			});

			// Check for compact-specific text
			expect(screen.getByText('Бан')).toBeInTheDocument();
			expect(screen.getByText('Удалить')).toBeInTheDocument();
		});

		test('renders unban in compact layout', () => {
			render(ActionButtons, {
				props: {
					agent: mockBannedAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete,
					compact: true
				}
			});

			expect(screen.getByText('Разбан')).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		test('has proper ARIA labels', () => {
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			const banButton = screen.getByRole('button', { name: /Ban Test Agent/i });
			const deleteButton = screen.getByRole('button', { name: /Delete Test Agent permanently/i });

			expect(banButton).toHaveAttribute('aria-label');
			expect(deleteButton).toHaveAttribute('aria-label');
		});

		test('has describedby attributes for additional context', () => {
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			const banButton = screen.getByRole('button', { name: /Ban Test Agent/i });
			const deleteButton = screen.getByRole('button', { name: /Delete Test Agent permanently/i });

			expect(banButton).toHaveAttribute('aria-describedby');
			expect(deleteButton).toHaveAttribute('aria-describedby');
		});

		test('has hidden descriptions for screen readers', () => {
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			expect(
				screen.getByText(/This will prevent the agent from accessing the system/)
			).toBeInTheDocument();
			expect(
				screen.getByText(/This action cannot be undone and will permanently remove all agent data/)
			).toBeInTheDocument();
		});

		test('updates description for banned agent', () => {
			render(ActionButtons, {
				props: {
					agent: mockBannedAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			expect(screen.getByText(/This will restore access for the agent/)).toBeInTheDocument();
		});

		test('supports keyboard navigation with Enter key', async () => {
			const user = userEvent.setup();
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			const banButton = screen.getByRole('button', { name: /Ban Test Agent/i });
			banButton.focus();

			await user.keyboard('{Enter}');
			expect(mockOnBan).toHaveBeenCalledWith(mockAgent);
		});

		test('supports keyboard navigation with Space key', async () => {
			const user = userEvent.setup();
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			const deleteButton = screen.getByRole('button', { name: /Delete Test Agent permanently/i });
			deleteButton.focus();

			await user.keyboard(' ');
			expect(mockOnDelete).toHaveBeenCalledWith(mockAgent);
		});
	});

	describe('Agent Status Handling', () => {
		test('handles agent without name gracefully', () => {
			const agentWithoutName = {
				id: '3',
				email: 'noname@example.com',
				status: 'active'
			};

			render(ActionButtons, {
				props: {
					agent: agentWithoutName,
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			// Should use email as fallback in aria-label
			expect(screen.getByRole('button', { name: /Ban noname@example.com/i })).toBeInTheDocument();
		});

		test('handles agent with agentStatus prop override', () => {
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					agentStatus: 'banned', // Override the agent.status
					onBan: mockOnBan,
					onDelete: mockOnDelete
				}
			});

			// Should show unban button based on agentStatus prop
			expect(screen.getByRole('button', { name: /Unban Test Agent/i })).toBeInTheDocument();
		});
	});

	describe('Error Handling', () => {
		test('does not call handlers when loading', async () => {
			const user = userEvent.setup();
			render(ActionButtons, {
				props: {
					agent: mockAgent,
					onBan: mockOnBan,
					onDelete: mockOnDelete,
					isLoading: true
				}
			});

			const banButton = screen.getByRole('button', { name: /Ban Test Agent/i });

			// Button should be disabled, but let's try to click anyway
			await user.click(banButton);

			// Should not call the handler when loading
			expect(mockOnBan).not.toHaveBeenCalled();
		});

		test('handles missing handlers gracefully', () => {
			// Should not throw error when handlers are not provided
			expect(() => {
				render(ActionButtons, {
					props: {
						agent: mockAgent
					}
				});
			}).not.toThrow();
		});
	});
});
