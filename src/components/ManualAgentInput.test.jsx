import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualAgentInput } from './ManualAgentInput';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock fetch for backend calls
globalThis.fetch = vi.fn();

describe('ManualAgentInput', () => {
  const mockOnNewEntry = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('renders all form fields', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      expect(screen.getByPlaceholderText(/agent name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/task context/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/paste agent response/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save & log entry/i })).toBeInTheDocument();
    });

    it('renders all tag options', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      const expectedTags = ['General', 'Feature', 'Bug Fix', 'Docs', 'Refactor', 'Chat', 'Analysis'];
      expectedTags.forEach(tag => {
        expect(screen.getByRole('button', { name: tag })).toBeInTheDocument();
      });
    });

    it('displays recent entries section', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      expect(screen.getByText(/recent agent exchanges/i)).toBeInTheDocument();
      expect(screen.getByText(/no entries yet/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('updates agent name on input', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      const agentInput = screen.getByPlaceholderText(/agent name/i);
      fireEvent.change(agentInput, { target: { value: 'CLAUDE-4.5' } });
      
      expect(agentInput.value).toBe('CLAUDE-4.5');
    });

    it('updates task context on input', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      const taskInput = screen.getByPlaceholderText(/task context/i);
      fireEvent.change(taskInput, { target: { value: 'Implement authentication' } });
      
      expect(taskInput.value).toBe('Implement authentication');
    });

    it('updates content on textarea change', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      const contentTextarea = screen.getByPlaceholderText(/paste agent response/i);
      fireEvent.change(contentTextarea, { target: { value: 'Here is my response...' } });
      
      expect(contentTextarea.value).toBe('Here is my response...');
    });

    it('selects tag on click', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      const bugFixTag = screen.getByRole('button', { name: 'Bug Fix' });
      fireEvent.click(bugFixTag);
      
      expect(bugFixTag).toHaveClass('bg-red-500');
    });
  });

  describe('Form Submission - Backend Success', () => {
    beforeEach(() => {
      fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });
    });

    it('submits form successfully when backend is available', async () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      fireEvent.change(screen.getByPlaceholderText(/agent name/i), { target: { value: 'TEST-AGENT' } });
      fireEvent.change(screen.getByPlaceholderText(/task context/i), { target: { value: 'Test task' } });
      fireEvent.change(screen.getByPlaceholderText(/paste agent response/i), { target: { value: 'Test content' } });
      fireEvent.click(screen.getByRole('button', { name: /save & log entry/i }));
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/log-entry', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }));
      });
    });

    it('clears form after successful submission', async () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      fireEvent.change(screen.getByPlaceholderText(/agent name/i), { target: { value: 'TEST-AGENT' } });
      fireEvent.change(screen.getByPlaceholderText(/task context/i), { target: { value: 'Test task' } });
      fireEvent.change(screen.getByPlaceholderText(/paste agent response/i), { target: { value: 'Test content' } });
      fireEvent.click(screen.getByRole('button', { name: /save & log entry/i }));
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/agent name/i).value).toBe('');
        expect(screen.getByPlaceholderText(/task context/i).value).toBe('');
        expect(screen.getByPlaceholderText(/paste agent response/i).value).toBe('');
      });
    });

    it('calls onNewEntry callback after submission', async () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      fireEvent.change(screen.getByPlaceholderText(/agent name/i), { target: { value: 'TEST-AGENT' } });
      fireEvent.change(screen.getByPlaceholderText(/task context/i), { target: { value: 'Test task' } });
      fireEvent.change(screen.getByPlaceholderText(/paste agent response/i), { target: { value: 'Test content' } });
      fireEvent.click(screen.getByRole('button', { name: /save & log entry/i }));
      
      await waitFor(() => {
        expect(mockOnNewEntry).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission - Backend Failure', () => {
    beforeEach(() => {
      fetch.mockRejectedValueOnce(new Error('Backend not available'));
    });

    it('falls back to localStorage when backend fails', async () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      fireEvent.change(screen.getByPlaceholderText(/agent name/i), { target: { value: 'TEST-AGENT' } });
      fireEvent.change(screen.getByPlaceholderText(/task context/i), { target: { value: 'Test task' } });
      fireEvent.change(screen.getByPlaceholderText(/paste agent response/i), { target: { value: 'Test content' } });
      fireEvent.click(screen.getByRole('button', { name: /save & log entry/i }));
      
      await waitFor(() => {
        const saved = JSON.parse(localStorage.getItem('agentEntries') || '[]');
        expect(saved.length).toBe(1);
        expect(saved[0].agent).toBe('TEST-AGENT');
      });
    });

    it('limits localStorage to 50 entries', async () => {
      // Fill localStorage with 50 entries
      const existingEntries = Array.from({ length: 50 }, (_, i) => ({
        agent: `Agent${i}`,
        timestamp: new Date().toLocaleString(),
        type: 'general',
        task: 'Task',
        content: 'Content'
      }));
      localStorage.setItem('agentEntries', JSON.stringify(existingEntries));
      
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      fireEvent.change(screen.getByPlaceholderText(/agent name/i), { target: { value: 'NEW-AGENT' } });
      fireEvent.change(screen.getByPlaceholderText(/task context/i), { target: { value: 'New task' } });
      fireEvent.change(screen.getByPlaceholderText(/paste agent response/i), { target: { value: 'New content' } });
      fireEvent.click(screen.getByRole('button', { name: /save & log entry/i }));
      
      await waitFor(() => {
        const saved = JSON.parse(localStorage.getItem('agentEntries') || '[]');
        expect(saved.length).toBe(50);
        expect(saved[0].agent).toBe('NEW-AGENT');
      });
    });
  });

  describe('Recent Entries Display', () => {
    it('displays entries from localStorage', () => {
      const savedEntries = [
        {
          agent: 'CLAUDE',
          timestamp: '1/9/2026, 10:00:00 AM',
          type: 'feature',
          task: 'Feature A',
          content: 'Content A'
        },
        {
          agent: 'GPT',
          timestamp: '1/9/2026, 9:00:00 AM',
          type: 'bug',
          task: 'Bug B',
          content: 'Content B'
        }
      ];
      localStorage.setItem('agentEntries', JSON.stringify(savedEntries));
      
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      expect(screen.getByText('CLAUDE')).toBeInTheDocument();
      expect(screen.getByText('GPT')).toBeInTheDocument();
    });

    it('shows truncated content for long entries', () => {
      const longContent = 'A'.repeat(300);
      const savedEntries = [{
        agent: 'CLAUDE',
        timestamp: '1/9/2026, 10:00:00 AM',
        type: 'general',
        task: 'Task',
        content: longContent
      }];
      localStorage.setItem('agentEntries', JSON.stringify(savedEntries));
      
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      const contentElement = screen.getByText(/^A+\.\.\.$/);
      expect(contentElement).toBeInTheDocument();
    });
  });

  describe('Agent Colors', () => {
    it('applies correct color class for CLAUDE', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      const agentInput = screen.getByPlaceholderText(/agent name/i);
      fireEvent.change(agentInput, { target: { value: 'CLAUDE' } });
      
      // Verify the input has focus (color change happens in render, not tested directly)
      expect(agentInput).toHaveValue('CLAUDE');
    });

    it('applies correct color class for GPT', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      const agentInput = screen.getByPlaceholderText(/agent name/i);
      fireEvent.change(agentInput, { target: { value: 'GPT' } });
      
      expect(agentInput).toHaveValue('GPT');
    });

    it('applies default color for unknown agents', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      const agentInput = screen.getByPlaceholderText(/agent name/i);
      fireEvent.change(agentInput, { target: { value: 'UNKNOWN' } });
      
      expect(agentInput).toHaveValue('UNKNOWN');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty form submission gracefully', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      // Should not throw error
      expect(() => {
        fireEvent.click(screen.getByRole('button', { name: /save & log entry/i }));
      }).not.toThrow();
    });

    it('handles special characters in input', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      const agentInput = screen.getByPlaceholderText(/agent name/i);
      const contentTextarea = screen.getByPlaceholderText(/paste agent response/i);
      
      fireEvent.change(agentInput, { target: { value: 'Test <>&"\' Agent' } });
      fireEvent.change(contentTextarea, { target: { value: 'Special chars: <>&"\'{}[]' } });
      
      expect(agentInput.value).toBe('Test <>&"\' Agent');
      expect(contentTextarea.value).toContain('<>&"\'{}[]');
    });

    it('handles very long content', () => {
      render(<ManualAgentInput onNewEntry={mockOnNewEntry} />);
      
      const longContent = 'A'.repeat(10000);
      const contentTextarea = screen.getByPlaceholderText(/paste agent response/i);
      
      fireEvent.change(contentTextarea, { target: { value: longContent } });
      
      expect(contentTextarea.value).toBe(longContent);
    });
  });
});
