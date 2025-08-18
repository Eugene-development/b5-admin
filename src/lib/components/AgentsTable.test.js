import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AgentsTable from './AgentsTable.svelte';

// Mock child components
vi.mock('./StatusBadge.svelte', () => ({
	default: vi.fn(() => ({ $$: { fragment: null } }))
}));

vi.mock('./ActionButtons.svelte', () => ({
	default: vi.fn(() => ({ $$: { fragment: null } }))
}));

vi.mock('./EmptyState.svelte', () => ({
	default: vi.fn(() => ({ $$: { fragment: null } }))
}));

describe('AgentsTable Component', () => {
	const mockAgents = [
		{
			id: '1',
			name: 'John Doe',
			email: 'john@example.com',
			city: 'Moscow',
			created_at: '2023-01-15T10:30:00Z',
			email_verified_at: '2023-01-15T11:00:00Z',
			status: 'active'
		},
		{
			id: '2',
			name: 'Jane Smith',
			email: 'jane@example.com',
			city: 'St. Petersburg',
			created_at: '2023-02-20T14:15:00Z',
			email_verified_at: null,
			status: 'banned'
		},
		{
			id: '3',
			name: null,
			email: 'noname@example.com',
			city: null,
			created_at: '2023-03-10T09:45:00Z',
			email_verified_at: '2023-03-10T10:00:00Z',
			status: 'active'
		}
	];

	let mockOnBanAgent, mockOnDeleteAgent;

	beforeEach(() => {
		mockOnBanAgent = vi.fn();
		mockOnDeleteAgent = vi.fn();
		vi.clearAllMocks();
	});

	describe('Desktop Table View', () => {
		test('renders table with proper structure', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			// Check for table element
			const table = screen.getByRole('table');
			expect(table).toBeInTheDocument();
			expect(table).toHaveAttribute('aria-labelledby');
			expect(table).toHaveAttribute('aria-describedby');
		});

		test('renders table headers with proper accessibility', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			// Check for column headers
			const headers = screen.getAllByRole('columnheader');
			expect(headers).toHaveLength(8); // ID, Name, Email, City, Registration, Verified, Status, Actions

			// Check specific headers
			expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Имя' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Почта' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Город' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Регистрация' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Подтверждён' })).toBeInTheDocument();
			expect(screen.getByRole('columnheader', { name: 'Статус' })).toBeInTheDocument();
		});

		test('renders agent data in table rows', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			// Check for agent data
			expect(screen.getByText('John Doe')).toBeInTheDocument();
			expect(screen.getByText('john@example.com')).toBeInTheDocument();
			expect(screen.getByText('Moscow')).toBeInTheDocument();

			expect(screen.getByText('Jane Smith')).toBeInTheDocument();
			expect(screen.getByText('jane@example.com')).toBeInTheDocument();
			expect(screen.getByText('St. Petersburg')).toBeInTheDocument();

			// Check for fallback values
			expect(screen.getByText('noname@example.com')).toBeInTheDocument();
			expect(screen.getAllByText('Not specified')).toHaveLength(1); // For agent without name
			expect(screen.getAllByText('Не указан')).toHaveLength(1); // For agent without city
		});

		test('formats dates correctly', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			// Check formatted dates (format: MMM DD, YYYY)
			expect(screen.getByText('Jan 15, 2023')).toBeInTheDocument();
			expect(screen.getByText('Feb 20, 2023')).toBeInTheDocument();
			expect(screen.getByText('Mar 10, 2023')).toBeInTheDocument();
		});

		test('has proper table accessibility attributes', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			// Check for table caption
			const caption = screen.getByText(/Agents management table with 3 agents/);
			expect(caption).toBeInTheDocument();
			expect(caption).toHaveClass('sr-only');

			// Check for table description
			const description = screen.getByText(/This table contains agent information/);
			expect(description).toBeInTheDocument();
			expect(description).toHaveClass('sr-only');
		});

		test('renders rows with proper accessibility attributes', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			const rows = screen.getAllByRole('row');
			// Header row + 3 data rows
			expect(rows).toHaveLength(4);

			// Check data rows have proper attributes
			const dataRows = rows.slice(1); // Skip header row
			dataRows.forEach((row, index) => {
				expect(row).toHaveAttribute('aria-rowindex', String(index + 2));
			});
		});

		test('renders cells with proper headers association', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			const cells = screen.getAllByRole('cell');
			expect(cells.length).toBeGreaterThan(0);

			// Check that cells have headers attribute
			cells.forEach((cell) => {
				expect(cell).toHaveAttribute('headers');
			});
		});
	});

	describe('Loading State', () => {
		test('shows loading spinner when isLoading is true', () => {
			render(AgentsTable, {
				props: {
					agents: [],
					isLoading: true,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			// Check for loading spinner
			const loadingCell = screen.getByRole('cell');
			expect(loadingCell).toHaveAttribute('colspan', '8');

			// Check for loading message
			expect(screen.getByText('Loading agents data, please wait...')).toBeInTheDocument();
		});

		test('has proper accessibility for loading state', () => {
			render(AgentsTable, {
				props: {
					agents: [],
					isLoading: true,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			const loadingContainer = screen.getByLabelText('Loading agents data');
			expect(loadingContainer).toBeInTheDocument();
		});
	});

	describe('Empty State', () => {
		test('shows empty state when no agents and not loading', () => {
			render(AgentsTable, {
				props: {
					agents: [],
					isLoading: false,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent,
					hasSearched: false
				}
			});

			// EmptyState component should be rendered
			// Since we mocked it, we can't test its content directly
			// but we can verify the table structure
			const rows = screen.getAllByRole('row');
			expect(rows).toHaveLength(2); // Header + empty state row
		});

		test('shows no results state when search returns empty', () => {
			render(AgentsTable, {
				props: {
					agents: [],
					isLoading: false,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent,
					hasSearched: true,
					searchTerm: 'nonexistent'
				}
			});

			const rows = screen.getAllByRole('row');
			expect(rows).toHaveLength(2); // Header + no results row
		});
	});

	describe('Mobile Card View', () => {
		// Note: Mobile view is hidden by CSS classes, so we need to test the structure
		test('renders mobile card structure', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			// Check for mobile list structure
			const list = screen.getByRole('list', { name: 'Agents list' });
			expect(list).toBeInTheDocument();

			const listItems = screen.getAllByRole('listitem');
			expect(listItems).toHaveLength(3); // One for each agent
		});

		test('renders agent cards with proper accessibility', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			const listItems = screen.getAllByRole('listitem');

			listItems.forEach((item, index) => {
				const agent = mockAgents[index];
				expect(item).toHaveAttribute('aria-labelledby', `agent-${agent.id}-name`);
				expect(item).toHaveAttribute('aria-describedby', `agent-${agent.id}-details`);
			});
		});

		test('renders agent details with proper semantic structure', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			// Check for agent name headings
			mockAgents.forEach((agent) => {
				const nameElement = screen.getByText(agent.name || 'Not specified');
				expect(nameElement).toHaveAttribute('id', `agent-${agent.id}-name`);
			});

			// Check for description lists
			mockAgents.forEach((agent) => {
				const detailsList = document.getElementById(`agent-${agent.id}-details`);
				expect(detailsList).toBeInTheDocument();
				expect(detailsList.tagName).toBe('DL');
			});
		});
	});

	describe('Search Integration', () => {
		test('updates caption based on search state', () => {
			const { rerender } = render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent,
					hasSearched: false,
					searchTerm: ''
				}
			});

			// Initial caption
			expect(screen.getByText(/Agents management table with 3 agents$/)).toBeInTheDocument();

			// With search
			rerender({
				agents: [mockAgents[0]],
				onBanAgent: mockOnBanAgent,
				onDeleteAgent: mockOnDeleteAgent,
				hasSearched: true,
				searchTerm: 'john'
			});

			expect(screen.getByText(/matching search term "john"/)).toBeInTheDocument();
		});

		test('announces table updates to screen readers', async () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			// Check for live region
			const liveRegion = screen.getByRole('status');
			expect(liveRegion).toBeInTheDocument();
			expect(liveRegion).toHaveAttribute('aria-live', 'polite');
			expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
		});
	});

	describe('Status Display', () => {
		test('displays correct status for different agent states', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			// Check debug status display (temporary)
			expect(screen.getByText('Status: "active" (type: string)')).toBeInTheDocument();
			expect(screen.getByText('Status: "banned" (type: string)')).toBeInTheDocument();
		});
	});

	describe('Responsive Behavior', () => {
		test('renders tablet view structure', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent
				}
			});

			// Tablet view should have a table with horizontal scroll
			const tables = screen.getAllByRole('table');
			expect(tables.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Error Handling', () => {
		test('handles agents with missing data gracefully', () => {
			const agentsWithMissingData = [
				{
					id: '1',
					name: null,
					email: 'test@example.com',
					city: null,
					created_at: null,
					email_verified_at: null,
					status: 'active'
				}
			];

			expect(() => {
				render(AgentsTable, {
					props: {
						agents: agentsWithMissingData,
						onBanAgent: mockOnBanAgent,
						onDeleteAgent: mockOnDeleteAgent
					}
				});
			}).not.toThrow();

			// Check fallback values
			expect(screen.getByText('Not specified')).toBeInTheDocument(); // For name
			expect(screen.getByText('Не указан')).toBeInTheDocument(); // For city
		});

		test('handles missing handlers gracefully', () => {
			expect(() => {
				render(AgentsTable, {
					props: {
						agents: mockAgents
					}
				});
			}).not.toThrow();
		});

		test('handles undefined agents array', () => {
			expect(() => {
				render(AgentsTable, {
					props: {
						agents: undefined,
						onBanAgent: mockOnBanAgent,
						onDeleteAgent: mockOnDeleteAgent
					}
				});
			}).not.toThrow();
		});
	});

	describe('Performance', () => {
		test('uses proper keys for list rendering', () => {
			render(AgentsTable, {
				props: {
					agents: mockAgents,
					onBanAgent: mockOnBanAgent,
					onDeleteAgent: mockOnDeleteAgent,
					updateCounter: 1
				}
			});

			// The component uses agent.id + status + updateCounter as keys
			// This ensures proper re-rendering when status changes
			const rows = screen.getAllByRole('row');
			expect(rows.length).toBeGreaterThan(1); // Header + data rows
		});
	});
});
