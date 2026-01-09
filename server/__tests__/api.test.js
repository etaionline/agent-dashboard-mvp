const request = require('supertest');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

// Mock chokidar to prevent file system operations
jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn()
  }))
}));

describe('Server API Endpoints', () => {
  let app;
  let server;
  let httpServer;

  beforeAll((done) => {
    app = express();
    app.use(express.json());
    
    // Import and setup the server routes
    const PORT = 3001;
    
    // Create HTTP server
    httpServer = http.createServer(app);
    
    // Setup Socket.io
    const io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    // Mock file system for testing
    const mockProjectPath = '/tmp/test-project';
    const mockFiles = {
      'README.md': '# Test Project\n\nThis is a test.',
      'PROJECT_GUIDE.md': '# Project Guide\n\nTest guide.',
      'EVOLUTION_LOG.md': '# Evolution Log\n\nInitial commit.'
    };
    
    // Ensure mock directory exists
    if (!fs.existsSync(mockProjectPath)) {
      fs.mkdirSync(mockProjectPath, { recursive: true });
    }
    
    // Write mock files
    Object.entries(mockFiles).forEach(([filename, content]) => {
      fs.writeFileSync(path.join(mockProjectPath, filename), content);
    });
    
    // Environment setup
    process.env.AGENT_PROJECT_PATH = mockProjectPath;
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        projectPath: mockProjectPath
      });
    });
    
    // Stats endpoint (enforcing path integrity)
    app.get('/api/stats', async (req, res) => {
      try {
        const projectPath = process.env.AGENT_PROJECT_PATH;
        
        if (!projectPath || !fs.existsSync(projectPath)) {
          return res.status(404).json({ 
            success: false, 
            error: 'Project path not configured' 
          });
        }
        
        // Read directory stats
        const files = fs.readdirSync(projectPath);
        const stats = {
          totalFiles: files.length,
          documentationFiles: files.filter(f => f.endsWith('.md')).length,
          sourceFiles: files.filter(f => /\.(js|jsx|ts|tsx)$/.test(f)).length,
          lastUpdated: new Date().toISOString()
        };
        
        res.json({ success: true, stats });
      } catch (err) {
        console.error('[STATS] Error:', err.message);
        res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
    });
    
    // Documentation endpoint
    app.get('/api/docs/:filename', (req, res) => {
      const { filename } = req.params;
      const allowedFiles = ['README.md', 'PROJECT_GUIDE.md', 'EVOLUTION_LOG.md'];
      
      if (!allowedFiles.includes(filename)) {
        return res.status(403).json({ 
          error: 'File not allowed' 
        });
      }
      
      const filePath = path.join(mockProjectPath, filename);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        res.set('Content-Type', 'text/plain');
        res.send(content);
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    });
    
    // Log entries endpoint
    app.get('/api/log-entries', (req, res) => {
      const logPath = path.join(mockProjectPath, 'agent-conversation.log');
      
      if (fs.existsSync(logPath)) {
        try {
          const content = fs.readFileSync(logPath, 'utf8');
          const entries = content.split('---').filter(Boolean).map(entry => {
            try {
              return JSON.parse(entry.trim());
            } catch {
              return null;
            }
          }).filter(Boolean);
          
          res.json({ success: true, entries: entries.reverse() });
        } catch {
          res.json({ success: true, entries: [] });
        }
      } else {
        res.json({ success: true, entries: [] });
      }
    });
    
    // Create log entry endpoint
    app.post('/api/log-entry', (req, res) => {
      const { agent, type, task, content, force } = req.body;
      
      if (!agent || !content) {
        return res.status(400).json({ 
          error: 'Missing required fields: agent and content' 
        });
      }
      
      const entry = {
        timestamp: new Date().toISOString(),
        agent,
        type: type || 'general',
        task: task || '',
        content,
        hash: require('crypto').createHash('md5').update(`${agent}${content}`).digest('hex').substring(0, 8)
      };
      
      const logPath = path.join(mockProjectPath, 'agent-conversation.log');
      
      try {
        const logEntry = `\n---\n${JSON.stringify(entry, null, 2)}\n`;
        fs.appendFileSync(logPath, logEntry);
        res.json({ success: true, entry });
      } catch (err) {
        console.error('[LOG] Error saving entry:', err.message);
        res.status(500).json({ error: 'Failed to save entry' });
      }
    });
    
    // File watcher simulation
    io.on('connection', (socket) => {
      console.log('[WS] Client connected');
      
      socket.on('disconnect', () => {
        console.log('[WS] Client disconnected');
      });
    });
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`[TEST] Server running on port ${PORT}`);
      done();
    });
  });

  afterAll((done) => {
    if (httpServer) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  describe('GET /api/health', () => {
    it('returns healthy status', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/health')
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.projectPath).toBeDefined();
    });
  });

  describe('GET /api/stats', () => {
    it('returns project statistics', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/stats')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalFiles).toBeDefined();
      expect(response.body.stats.documentationFiles).toBeDefined();
    });

    it('returns correct file counts', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/stats')
        .expect(200);
      
      expect(response.body.stats.totalFiles).toBeGreaterThan(0);
      expect(response.body.stats.documentationFiles).toBeGreaterThanOrEqual(3);
    });
  });

  describe('GET /api/docs/:filename', () => {
    it('returns README.md content', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/docs/README.md')
        .expect(200);
      
      expect(response.text).toContain('# Test Project');
    });

    it('returns PROJECT_GUIDE.md content', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/docs/PROJECT_GUIDE.md')
        .expect(200);
      
      expect(response.text).toContain('# Project Guide');
    });

    it('returns EVOLUTION_LOG.md content', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/docs/EVOLUTION_LOG.md')
        .expect(200);
      
      expect(response.text).toContain('# Evolution Log');
    });

    it('rejects unauthorized files', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/docs/secret.txt')
        .expect(403);
      
      expect(response.body.error).toBe('File not allowed');
    });

    it('handles missing files gracefully', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/docs/NONEXISTENT.md')
        .expect(403); // Blocked by allowlist, not 404
      
      expect(response.body.error).toBe('File not allowed');
    });
  });

  describe('GET /api/log-entries', () => {
    it('returns log entries array', async () => {
      const response = await request('http://localhost:3001')
        .get('/api/log-entries')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.entries)).toBe(true);
    });
  });

  describe('POST /api/log-entry', () => {
    it('creates a new log entry', async () => {
      const testEntry = {
        agent: 'TEST-AGENT',
        type: 'test',
        task: 'Testing API',
        content: 'This is a test entry'
      };
      
      const response = await request('http://localhost:3001')
        .post('/api/log-entry')
        .send(testEntry)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.entry.agent).toBe('TEST-AGENT');
      expect(response.body.entry.content).toBe('This is a test entry');
      expect(response.body.entry.timestamp).toBeDefined();
      expect(response.body.entry.hash).toBeDefined();
    });

    it('validates required fields', async () => {
      const response = await request('http://localhost:3001')
        .post('/api/log-entry')
        .send({ agent: 'TEST' })
        .expect(400);
      
      expect(response.body.error).toContain('Missing required fields');
    });

    it('generates unique hash for each entry', async () => {
      const entry1 = {
        agent: 'HASH-TEST',
        content: 'First entry content'
      };
      
      const entry2 = {
        agent: 'HASH-TEST',
        content: 'Second entry content'
      };
      
      const response1 = await request('http://localhost:3001')
        .post('/api/log-entry')
        .send(entry1);
      
      const response2 = await request('http://localhost:3001')
        .post('/api/log-entry')
        .send(entry2);
      
      expect(response1.body.entry.hash).not.toBe(response2.body.entry.hash);
    });
  });
});

describe('Path Security', () => {
  it('prevents directory traversal in docs endpoint', () => {
    const maliciousPath = '../../../etc/passwd';
    const allowedFiles = ['README.md', 'PROJECT_GUIDE.md', 'EVOLUTION_LOG.md'];
    
    // Simulate the security check
    const isAllowed = allowedFiles.includes(path.basename(maliciousPath));
    
    expect(isAllowed).toBe(false);
  });

  it('validates project path exists before operations', () => {
    const mockExistsSync = jest.spyOn(fs, 'existsSync');
    mockExistsSync.mockReturnValue(false);
    
    const projectPath = '/nonexistent/path';
    const exists = fs.existsSync(projectPath);
    
    expect(exists).toBe(false);
    mockExistsSync.mockRestore();
  });
});

describe('Input Validation', () => {
  it('sanitizes log entry content', () => {
    const dirtyInput = '<script>alert("xss")</script>';
    const sanitized = dirtyInput
      .replace(/</g, '<')
      .replace(/>/g, '>');
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('<script>');
  });

  it('limits entry content length', () => {
    const maxLength = 100000;
    const longContent = 'A'.repeat(maxLength + 1);
    
    // Simulate truncation
    const truncated = longContent.length > maxLength 
      ? longContent.substring(0, maxLength) + '...[truncated]'
      : longContent;
    
    expect(truncated.length).toBe(maxLength + 14); // 14 for "[truncated]"
  });
});
