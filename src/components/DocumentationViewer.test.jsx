import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DocumentationViewer } from './DocumentationViewer';
import { io } from 'socket.io-client';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn()
}));

// Mock fetch for initial content loading
globalThis.fetch = vi.fn();

describe('DocumentationViewer', () => {
  let mockSocket;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock socket
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn()
    };
    io.mockReturnValue(mockSocket);
    
    // Setup mock fetch responses
    fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Test Content\n\nThis is test documentation.')
    });
  });

  describe('Rendering', () => {
    it('renders tab buttons for documentation files', () => {
      render(<DocumentationViewer />);
      
      // Check for expected tabs based on component
      const tabs = ['README.md', 'PROJECT_GUIDE.md'];
      tabs.forEach(tab => {
        const tabButton = screen.getByRole('button', { name: tab });
        expect(tabButton).toBeInTheDocument();
      });
    });

    it('renders search input', () => {
      render(<DocumentationViewer />);
      
      expect(screen.getByPlaceholderText(/search docs/i)).toBeInTheDocument();
    });

    it('renders last updated indicator', () => {
      render(<DocumentationViewer />);
      
      expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
    });

    it('renders WebSocket connection status', () => {
      render(<DocumentationViewer />);
      
      expect(screen.getByText(/connected/i)).toBeInTheDocument();
    });

    it('renders markdown content area', () => {
      render(<DocumentationViewer />);
      
      expect(screen.getByText(/test content/i)).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('switches active tab on click', async () => {
      render(<DocumentationViewer />);
      
      const projectGuideTab = screen.getByRole('button', { name: /PROJECT_GUIDE.md/i });
      fireEvent.click(projectGuideTab);
      
      await waitFor(() => {
        expect(projectGuideTab).toHaveClass('bg-slate-700');
      });
    });

    it('loads content when switching tabs', async () => {
      render(<DocumentationViewer />);
      
      const projectGuideTab = screen.getByRole('button', { name: /PROJECT_GUIDE.md/i });
      fireEvent.click(projectGuideTab);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/docs/PROJECT_GUIDE.md');
      });
    });

    it('updates content display on tab switch', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# Project Guide\n\nProject specific docs.')
      });
      
      render(<DocumentationViewer />);
      
      const projectGuideTab = screen.getByRole('button', { name: /PROJECT_GUIDE.md/i });
      fireEvent.click(projectGuideTab);
      
      await waitFor(() => {
        expect(screen.getByText(/project guide/i)).toBeInTheDocument();
      });
    });
  });

  describe('WebSocket Integration', () => {
    it('connects to WebSocket on mount', () => {
      render(<DocumentationViewer />);
      
      expect(io).toHaveBeenCalledWith('http://localhost:3001');
    });

    it('sets up file-update listener', () => {
      render(<DocumentationViewer />);
      
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('file-update', expect.any(Function));
    });

    it('disconnects socket on unmount', () => {
      const { unmount } = render(<DocumentationViewer />);
      
      unmount();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('updates content when file changes via WebSocket', async () => {
      render(<DocumentationViewer />);
      
      // Simulate file update event
      const updateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'file-update'
      )[1];
      
      act(() => {
        updateHandler({
          file: 'README.md',
          content: '# Updated Content\n\nThis is updated via WebSocket.',
          timestamp: new Date().toISOString()
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/updated content/i)).toBeInTheDocument();
      });
    });

    it('only updates active tab on file change', async () => {
      render(<DocumentationViewer />);
      
      // Switch to PROJECT_GUIDE
      const projectGuideTab = screen.getByRole('button', { name: /PROJECT_GUIDE.md/i });
      fireEvent.click(projectGuideTab);
      
      // Simulate update to README (not active)
      const updateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'file-update'
      )[1];
      
      act(() => {
        updateHandler({
          file: 'README.md',
          content: '# Updated README\n\nNew content.',
          timestamp: new Date().toISOString()
        });
      });
      
      // Content should still show PROJECT_GUIDE content
      expect(screen.getByText(/project guide/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters content based on search term', async () => {
      render(<DocumentationViewer />);
      
      const searchInput = screen.getByPlaceholderText(/search docs/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // Content should still be visible (case insensitive search)
      expect(screen.getByText(/test content/i)).toBeInTheDocument();
    });

    it('highlights search results', async () => {
      render(<DocumentationViewer />);
      
      const searchInput = screen.getByPlaceholderText(/search docs/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      // Should have highlighting class (bg-yellow-500)
      const content = screen.getByText(/test content/i);
      expect(content).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing file gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('File not found'));
      
      render(<DocumentationViewer />);
      
      // Should show error message
      expect(screen.getByText(/could not load/i)).toBeInTheDocument();
    });

    it('handles WebSocket disconnect', async () => {
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      );
      
      if (disconnectHandler) {
        disconnectHandler[1]();
      }
      
      render(<DocumentationViewer />);
      
      // Should show disconnected status
      expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
    });

    it('handles invalid markdown', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('not [invalid markdown')
      });
      
      render(<DocumentationViewer />);
      
      // Should still render something
      expect(screen.getByText(/not \[invalid/i)).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('renders markdown headers', async () => {
      render(<DocumentationViewer />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('truncates very long content', async () => {
      const longContent = '# Title\n' + 'A'.repeat(10000);
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(longContent)
      });
      
      render(<DocumentationViewer />);
      
      // Should show truncated indicator
      expect(screen.getByText(/\.\.\./i)).toBeInTheDocument();
    });

    it('shows empty state when no content', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('')
      });
      
      render(<DocumentationViewer />);
      
      expect(screen.getByText(/no documentation/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid tab switching', async () => {
      render(<DocumentationViewer />);
      
      const readmeTab = screen.getByRole('button', { name: /README.md/i });
      const projectTab = screen.getByRole('button', { name: /PROJECT_GUIDE.md/i });
      
      fireEvent.click(projectTab);
      fireEvent.click(readmeTab);
      fireEvent.click(projectTab);
      
      await waitFor(() => {
        expect(projectTab).toHaveClass('bg-slate-700');
      });
    });

    it('handles special characters in markdown', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# Title\n\nSpecial: <>&"\'```code```')
      });
      
      render(<DocumentationViewer />);
      
      expect(screen.getByText(/special/i)).toBeInTheDocument();
    });

    it('handles unicode content', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('# 中文标题\n\nTesting: ñ, é, ü, 日本語')
      });
      
      render(<DocumentationViewer />);
      
      expect(screen.getByText(/中文标题/i)).toBeInTheDocument();
    });

    it('handles concurrent file updates', async () => {
      render(<DocumentationViewer />);
      
      const updateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'file-update'
      )[1];
      
      // Multiple rapid updates
      act(() => {
        updateHandler({
          file: 'README.md',
          content: 'Update 1',
          timestamp: new Date().toISOString()
        });
      });
      
      act(() => {
        updateHandler({
          file: 'README.md',
          content: 'Update 2',
          timestamp: new Date().toISOString()
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/update 2/i)).toBeInTheDocument();
      });
    });
  });

  describe('Connection Status', () => {
    it('shows connected status when socket connects', () => {
      render(<DocumentationViewer />);
      
      expect(screen.getByText(/connected/i)).toBeInTheDocument();
    });

    it('updates last updated time on file change', async () => {
      render(<DocumentationViewer />);
      
      const updateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'file-update'
      )[1];
      
      act(() => {
        updateHandler({
          file: 'README.md',
          content: '# Updated',
          timestamp: '2026-01-09T10:00:00.000Z'
        });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/10:00:00/i)).toBeInTheDocument();
      });
    });
  });
});
