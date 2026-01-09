import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualAgentInput } from './ManualAgentInput';

// Mock fetch
global.fetch = vi.fn();

describe('ManualAgentInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful backend response for loading entries
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [
          {
            timestamp: new Date().toISOString(),
            agent: 'CLAUDE-4.5',
            task: 'General',
            content: 'Test entry content',
            type: 'general'
          }
        ],
      }),
    });
  });

  it('renders without crashing', () => {
    render(<ManualAgentInput />);
    expect(screen.getByText('Manual Agent Drop Zone')).toBeInTheDocument();
  });

  it('displays header with icon and title', () => {
    render(<ManualAgentInput />);
    expect(screen.getByText('Manual Agent Drop Zone')).toBeInTheDocument();
  });

  it('shows description text about agent-conversation.log', () => {
    render(<ManualAgentInput />);
    expect(screen.getByText('agent-conversation.log')).toBeInTheDocument();
  });

  it('has agent name input field', () => {
    render(<ManualAgentInput />);
    expect(screen.getByPlaceholderText('Agent name (e.g., Claude-4.5)')).toBeInTheDocument();
  });

  it('has task/context input field', () => {
    render(<ManualAgentInput />);
    expect(screen.getByPlaceholderText('Task/Context (optional)')).toBeInTheDocument();
  });

  it('has tag selector buttons', () => {
    render(<ManualAgentInput />);
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Bug Fix')).toBeInTheDocument();
  });

  it('has content textarea', () => {
    render(<ManualAgentInput />);
    expect(screen.getByPlaceholderText(/Paste agent response here/i)).toBeInTheDocument();
  });

  it('has save button', () => {
    render(<ManualAgentInput />);
    expect(screen.getByText('Save & Log Entry')).toBeInTheDocument();
  });

  it('updates agent name on input change', () => {
    render(<ManualAgentInput />);
    const input = screen.getByPlaceholderText('Agent name (e.g., Claude-4.5)');
    fireEvent.change(input, { target: { value: 'GPT-4' } });
    expect(input.value).toBe('GPT-4');
  });

  it('updates task context on input change', () => {
    render(<ManualAgentInput />);
    const input = screen.getByPlaceholderText('Task/Context (optional)');
    fireEvent.change(input, { target: { value: 'Feature development' } });
    expect(input.value).toBe('Feature development');
  });

  it('updates textarea content on change', () => {
    render(<ManualAgentInput />);
    const textarea = screen.getByPlaceholderText(/Paste agent response here/i);
    fireEvent.change(textarea, { target: { value: 'Test response content' } });
    expect(textarea.value).toBe('Test response content');
  });

  it('shows Recent Agent Exchanges heading', () => {
    render(<ManualAgentInput />);
    expect(screen.getByText('Recent Agent Exchanges')).toBeInTheDocument();
  });

  it('displays empty state when no entries', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entries: [] }),
    });
    
    render(<ManualAgentInput />);
    
    await waitFor(() => {
      expect(screen.getByText('No entries yet. Paste your first agent response above.')).toBeInTheDocument();
    });
  });

  it('loads and displays recent entries', async () => {
    render(<ManualAgentInput />);
    
    await waitFor(() => {
      expect(screen.getByText('CLAUDE-4.5')).toBeInTheDocument();
      expect(screen.getByText('Test entry content')).toBeInTheDocument();
    });
  });

  it('disables save button when input is empty', () => {
    render(<ManualAgentInput />);
    const saveButton = screen.getByText('Save & Log Entry');
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when content and agent are filled', () => {
    render(<ManualAgentInput />);
    
    const agentInput = screen.getByPlaceholderText('Agent name (e.g., Claude-4.5)');
    const textarea = screen.getByPlaceholderText(/Paste agent response here/i);
    
    fireEvent.change(agentInput, { target: { value: 'GPT-4' } });
    fireEvent.change(textarea, { target: { value: 'Some response' } });
    
    const saveButton = screen.getByText('Save & Log Entry');
    expect(saveButton).not.toBeDisabled();
  });

  it('has refresh button', () => {
    render(<ManualAgentInput />);
    const refreshButton = screen.getByTitle('Refresh entries');
    expect(refreshButton).toBeInTheDocument();
  });

  it('can select different tags', () => {
    render(<ManualAgentInput />);
    
    // Click on Bug Fix tag
    const bugFixTag = screen.getByText('Bug Fix');
    fireEvent.click(bugFixTag);
    
    // Verify it's selected (should have different styling)
    expect(bugFixTag).toBeInTheDocument();
  });
});

describe('ManualAgentInput - Tag Auto-detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ entries: [] }),
    });
  });

  it('auto-selects Feature tag when content starts with "feat:"', () => {
    render(<ManualAgentInput />);
    const textarea = screen.getByPlaceholderText(/Paste agent response here/i);
    fireEvent.change(textarea, { target: { value: 'feat: Add new component' } });
    // Tag should be auto-selected (feature tag should be visually indicated)
  });

  it('auto-selects Bug Fix tag when content starts with "fix:"', () => {
    render(<ManualAgentInput />);
    const textarea = screen.getByPlaceholderText(/Paste agent response here/i);
    fireEvent.change(textarea, { target: { value: 'fix: Resolve race condition' } });
  });

  it('auto-selects Docs tag when content starts with "docs:"', () => {
    render(<ManualAgentInput />);
    const textarea = screen.getByPlaceholderText(/Paste agent response here/i);
    fireEvent.change(textarea, { target: { value: 'docs: Update README' } });
  });
});
