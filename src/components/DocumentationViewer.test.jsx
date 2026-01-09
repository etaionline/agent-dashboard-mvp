import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { DocumentationViewer } from './DocumentationViewer';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('DocumentationViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful document loading
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: '# Test Document\n\nThis is test content for the documentation viewer.',
      }),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders without crashing', () => {
    render(<DocumentationViewer />);
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('displays header with title', () => {
    render(<DocumentationViewer />);
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('shows documentation tabs', () => {
    render(<DocumentationViewer />);
    expect(screen.getByText('README')).toBeInTheDocument();
    expect(screen.getByText('PROJECT_GUIDE')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Agent Log')).toBeInTheDocument();
    expect(screen.getByText('Change Log')).toBeInTheDocument();
  });

  it('has search input field', () => {
    render(<DocumentationViewer />);
    expect(screen.getByPlaceholderText('Search in document...')).toBeInTheDocument();
  });

  it('has refresh button', () => {
    render(<DocumentationViewer />);
    expect(screen.getByTitle('Refresh')).toBeInTheDocument();
  });

  it('switches tabs on click', async () => {
    render(<DocumentationViewer />);
    
    // Click on PROJECT_GUIDE tab
    const projectGuideTab = screen.getByText('PROJECT_GUIDE');
    fireEvent.click(projectGuideTab);
    
    await waitFor(() => {
      expect(screen.getByText('PROJECT_GUIDE')).toBeInTheDocument();
    });
  });

  it('loads content when tab changes', async () => {
    render(<DocumentationViewer />);
    
    // Click on PROJECT_GUIDE tab
    fireEvent.click(screen.getByText('PROJECT_GUIDE'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/docs/PROJECT_GUIDE.md');
    });
  });

  it('displays loading state while fetching', async () => {
    // Slow response
    fetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: async () => ({ content: 'Test' }),
    }), 100)));
    
    render(<DocumentationViewer />);
    
    // Tab click should trigger loading
    fireEvent.click(screen.getByText('Getting Started'));
    
    // Should see loading indicator briefly
    expect(screen.getByText('Loading document...')).toBeInTheDocument();
  });

  it('displays document content', async () => {
    render(<DocumentationViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
  });

  it('filters content based on search term', async () => {
    render(<DocumentationViewer />);
    
    const searchInput = screen.getByPlaceholderText('Search in document...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Should filter the content
    expect(searchInput.value).toBe('test');
  });

  it('shows no matches message when search has no results', async () => {
    render(<DocumentationViewer />);
    
    const searchInput = screen.getByPlaceholderText('Search in document...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    await waitFor(() => {
      expect(screen.getByText(/No matches found/i)).toBeInTheDocument();
    });
  });

  it('displays current file name in footer', async () => {
    render(<DocumentationViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('README.md')).toBeInTheDocument();
    });
  });

  it('shows Updated timestamp when document is loaded', async () => {
    render(<DocumentationViewer />);
    
    await waitFor(() => {
      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });
  });
});

describe('DocumentationViewer - Tab Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: 'Mock document content',
      }),
    });
  });

  it('loads README by default', async () => {
    render(<DocumentationViewer />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/docs/README.md');
    });
  });

  it('loads GETTING_STARTED.md when tab clicked', async () => {
    render(<DocumentationViewer />);
    
    fireEvent.click(screen.getByText('Getting Started'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/docs/GETTING_STARTED.md');
    });
  });

  it('loads agent-conversation.log when tab clicked', async () => {
    render(<DocumentationViewer />);
    
    fireEvent.click(screen.getByText('Agent Log'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/docs/agent-conversation.log');
    });
  });

  it('loads change_log.txt when tab clicked', async () => {
    render(<DocumentationViewer />);
    
    fireEvent.click(screen.getByText('Change Log'));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/docs/change_log.txt');
    });
  });
});

describe('DocumentationViewer - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error message when document not found', async () => {
    fetch.mockResolvedValue({
      ok: false,
    });
    
    render(<DocumentationViewer />);
    
    await waitFor(() => {
      expect(screen.getByText(/Document not found/i)).toBeInTheDocument();
    });
  });

  it('shows error when backend is not available', async () => {
    fetch.mockRejectedValue(new Error('Network error'));
    
    render(<DocumentationViewer />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load document/i)).toBeInTheDocument();
    });
  });
});

describe('DocumentationViewer - Search Clear', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        content: '# Test Document\n\nThis is test content.',
      }),
    });
  });

  it('clears search when X button clicked', async () => {
    render(<DocumentationViewer />);
    
    const searchInput = screen.getByPlaceholderText('Search in document...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Click clear button
    const clearButton = screen.getByText('✕');
    fireEvent.click(clearButton);
    
    expect(searchInput.value).toBe('');
  });
});
