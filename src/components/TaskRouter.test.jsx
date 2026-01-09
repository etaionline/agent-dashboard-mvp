import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskRouter } from './TaskRouter';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('TaskRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders task input field', () => {
      render(<TaskRouter />);
      
      expect(screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i)).toBeInTheDocument();
    });

    it('renders analyze button', () => {
      render(<TaskRouter />);
      
      expect(screen.getByRole('button', { name: /analyze task/i })).toBeInTheDocument();
    });

    it('renders header title', () => {
      render(<TaskRouter />);
      
      expect(screen.getByText(/task router/i)).toBeInTheDocument();
    });
  });

  describe('Task Analysis', () => {
    it('detects HIGH complexity for architecture tasks', async () => {
      render(<TaskRouter />);
      
      const input = screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i);
      fireEvent.change(input, { target: { value: 'Design a new architecture for the system' } });
      fireEvent.click(screen.getByRole('button', { name: /analyze task/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/HIGH/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('detects HIGH complexity for refactor tasks', async () => {
      render(<TaskRouter />);
      
      const input = screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i);
      fireEvent.change(input, { target: { value: 'Refactor the authentication module' } });
      fireEvent.click(screen.getByRole('button', { name: /analyze task/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/HIGH/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('detects MEDIUM complexity for standard tasks', async () => {
      render(<TaskRouter />);
      
      const input = screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i);
      fireEvent.change(input, { target: { value: 'Add a button to the UI' } });
      fireEvent.click(screen.getByRole('button', { name: /analyze task/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/MEDIUM/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('detects LOW complexity for simple tasks', async () => {
      render(<TaskRouter />);
      
      const input = screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i);
      fireEvent.change(input, { target: { value: 'Fix button styling' } });
      fireEvent.click(screen.getByRole('button', { name: /analyze task/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/LOW/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('does not analyze empty task', () => {
      render(<TaskRouter />);
      
      const button = screen.getByRole('button', { name: /analyze task/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Agent Recommendation', () => {
    it('recommends Mistral for strategic planning', async () => {
      render(<TaskRouter />);
      
      const input = screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i);
      fireEvent.change(input, { target: { value: 'Design system architecture' } });
      fireEvent.click(screen.getByRole('button', { name: /analyze task/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/mistral/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('shows Bougie Budget reminder', async () => {
      render(<TaskRouter />);
      
      const input = screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i);
      fireEvent.change(input, { target: { value: 'Add a feature' } });
      fireEvent.click(screen.getByRole('button', { name: /analyze task/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/bougie budget/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Workflow Generation', () => {
    it('generates workflow steps for high complexity tasks', async () => {
      render(<TaskRouter />);
      
      const input = screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i);
      fireEvent.change(input, { target: { value: 'Design new system architecture' } });
      fireEvent.click(screen.getByRole('button', { name: /analyze task/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/step 1/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('generates fewer steps for low complexity tasks', async () => {
      render(<TaskRouter />);
      
      const input = screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i);
      fireEvent.change(input, { target: { value: 'Fix button color' } });
      fireEvent.click(screen.getByRole('button', { name: /analyze task/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/quick implementation/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    it('handles button disabled state when input is empty', () => {
      render(<TaskRouter />);
      
      const button = screen.getByRole('button', { name: /analyze task/i });
      expect(button).toBeDisabled();
    });

    it('enables button when input has value', () => {
      render(<TaskRouter />);
      
      const input = screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i);
      const button = screen.getByRole('button', { name: /analyze task/i });
      
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(button).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in task description', async () => {
      render(<TaskRouter />);
      
      const input = screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i);
      fireEvent.change(input, { target: { value: 'Fix bug test' } });
      fireEvent.click(screen.getByRole('button', { name: /analyze task/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/MEDIUM/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles unicode characters in task description', async () => {
      render(<TaskRouter />);
      
      const input = screen.getByPlaceholderText(/e\.g\., add dark mode toggle/i);
      fireEvent.change(input, { target: { value: 'Add feature' } });
      fireEvent.click(screen.getByRole('button', { name: /analyze task/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/MEDIUM/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});
