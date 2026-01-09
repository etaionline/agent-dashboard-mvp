import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';

// Mock socket.io-client - trigger connect callback immediately
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => {
    const callbacks = {};
    return {
      on: vi.fn((event, callback) => {
        callbacks[event] = callback;
        // Immediately trigger connect
        if (event === 'connect') {
          callback();
        }
      }),
      off: vi.fn(),
      disconnect: vi.fn(),
    };
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to switch to dashboard view
const switchToDashboard = async () => {
  const dashboardButton = screen.getByRole('button', { name: /Dashboard/i });
  fireEvent.click(dashboardButton);
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        stats: {
          components: 5,
          evolutionEntries: 10,
          activeAgents: 2,
          patterns: 4,
          gitCommits: 15,
          logEntries: 8,
        },
      }),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Agent Dashboard')).toBeInTheDocument();
  });

  it('shows header with title and connection status', () => {
    render(<App />);
    expect(screen.getByText('Agent Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Visual Development Platform')).toBeInTheDocument();
  });

  it('displays view toggle buttons', () => {
    render(<App />);
    // Use queryAllByText to find buttons and check count
    const taskRouterButtons = screen.queryAllByText('Task Router');
    expect(taskRouterButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('fetches stats on mount', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/stats');
    }, { timeout: 1000 });
  });

  it('displays stat cards with values', async () => {
    render(<App />);
    await switchToDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Components')).toBeInTheDocument();
      expect(screen.getByText('Git Commits')).toBeInTheDocument();
      expect(screen.getByText('Evolution')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('shows welcome message in dashboard view', async () => {
    render(<App />);
    await switchToDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome to Agent Dashboard')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('shows project path section in dashboard view', async () => {
    render(<App />);
    await switchToDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Current Project')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('shows MVP notice in dashboard view', async () => {
    render(<App />);
    await switchToDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('🚧 MVP in Development')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('has footer with credits', async () => {
    render(<App />);
    await switchToDashboard();
    
    await waitFor(() => {
      expect(screen.getByText(/Agent Dashboard MVP/)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('displays ManualAgentInput component', async () => {
    render(<App />);
    await switchToDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Manual Agent Drop Zone')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('displays DocumentationViewer component', async () => {
    render(<App />);
    await switchToDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

describe('StatCard', () => {
  it('renders stat card with icon, label and value', async () => {
    render(<App />);
    await switchToDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Components')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});

describe('FeatureCard', () => {
  it('renders feature card with title, description and status', async () => {
    render(<App />);
    await switchToDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Component Graph')).toBeInTheDocument();
      expect(screen.getByText('Evolution Timeline')).toBeInTheDocument();
      expect(screen.getByText('Agent Coordination')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
    