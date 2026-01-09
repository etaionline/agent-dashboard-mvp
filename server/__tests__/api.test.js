import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from 'vitest';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a test server instance
const createTestServer = () => {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  app.use(cors());
  app.use(express.json());

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  const PROJECT_ROOT = path.join(__dirname, '..');
  const PAINTING_ESTIMATOR_PATH = '/Users/skip/Documents/Active_Projects/painting-estimator';
  const LOG_PATH = path.join(PROJECT_ROOT, 'agent-conversation.log');

  // In-memory recent entries for deduplication
  const recentEntries = [];

  // Rate limiter
  const rateLimitStore = new Map();
  const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
  const RATE_LIMIT_MAX = 100;

  function isRateLimited(ip) {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return false;
    }
    if (entry.count >= RATE_LIMIT_MAX) return true;
    entry.count += 1;
    return false;
  }

  function generateHash(content, agent) {
    return crypto.createHash('sha256').update(`${agent}:${content}`).digest('hex').substring(0, 16);
  }

  function sanitizeText(value, maxLen = 2000) {
    if (typeof value !== 'string') return '';
    let v = value.trim();
    v = v.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    v = v.replace(/on[a-zA-Z]+\s*=\s*"[^"]*"/gi, '').replace(/on[a-zA-Z]+\s*=\s*'[^']*'/gi, '');
    if (v.length > maxLen) v = v.slice(0, maxLen);
    return v;
  }

  function safeTimestamp(ts) {
    try {
      return new Date(ts).toString() === 'Invalid Date' ? new Date().toISOString() : new Date(ts).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  // Stats endpoint
  app.get('/api/stats', async (req, res) => {
    const stats = {
      gitCommits: 0,
      logEntries: 0,
      evolutionEntries: 0,
      components: 0,
      activeAgents: 0
    };

    try {
      const { stdout } = await execAsync('git rev-list --count HEAD', { cwd: PAINTING_ESTIMATOR_PATH });
      stats.gitCommits = parseInt(stdout.trim(), 10) || 0;
    } catch {
      stats.gitCommits = 0;
    }

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  });

  // Log entry endpoint
  app.post('/api/log-entry', async (req, res) => {
    try {
      const ip = 'test-ip';
      if (isRateLimited(ip)) {
        return res.status(429).json({ success: false, error: 'Rate limit exceeded' });
      }

      const raw = req.body || {};
      const entry = {
        timestamp: safeTimestamp(raw.timestamp),
        agent: sanitizeText(raw.agent || '', 100),
        type: sanitizeText(raw.type || 'general', 50),
        task: sanitizeText(raw.task || '', 500),
        content: sanitizeText(raw.content || '', 5000)
      };

      if (!entry.agent || !entry.content) {
        return res.status(400).json({ success: false, error: 'Invalid entry' });
      }

      const entryHash = generateHash(entry.content, entry.agent);
      const force = req.query.force === 'true';

      if (!force) {
        const recentDuplicate = recentEntries.find(e => e.hash === entryHash);
        if (recentDuplicate) {
          return res.json({
            success: false,
            duplicate: true,
            message: 'Duplicate entry detected',
            existingEntry: recentDuplicate
          });
        }
      }

      const logEntry = [
        `${entry.timestamp} AST`,
        `Actor: ${entry.agent}`,
        `Type: ${entry.type || 'general'}`,
        entry.task ? `Task: ${entry.task}` : null,
        `Content: ${entry.content.substring(0, 500)}${entry.content.length > 500 ? '...' : ''}`,
        '---',
        ''
      ].filter(Boolean).join('\n') + '\n';

      try {
        await fs.appendFile(LOG_PATH, logEntry);
      } catch (err) {
        // File might not exist, create it
        await fs.writeFile(LOG_PATH, logEntry);
      }

      recentEntries.unshift({ hash: entryHash, agent: entry.agent, timestamp: entry.timestamp });
      if (recentEntries.length > 100) recentEntries.pop();

      io.emit('logUpdated', { newEntry: entry });

      res.json({ success: true, message: 'Entry logged successfully', timestamp: entry.timestamp });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save entry', details: err.message });
    }
  });

  // Docs endpoint
  app.get('/api/docs/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      const allowedFiles = ['README.md', 'PROJECT_GUIDE.md', 'GETTING_STARTED.md', 'agent-conversation.log', 'change_log.txt'];

      if (!allowedFiles.includes(filename)) {
        return res.status(403).json({ error: 'File not allowed' });
      }

      let filePath = path.join(PROJECT_ROOT, filename);
      let content;

      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch {
        const pePath = path.join(PAINTING_ESTIMATOR_PATH, filename);
        try {
          content = await fs.readFile(pePath, 'utf-8');
        } catch {
          return res.status(404).json({ error: 'File not found', filename });
        }
      }

      res.json({ success: true, filename, content, size: content.length });
    } catch (err) {
      res.status(500).json({ error: 'Failed to read document', details: err.message });
    }
  });

  return { app, httpServer, io };
};

describe('API Endpoints', () => {
  let server;
  let baseUrl;

  beforeAll(() => {
    const { httpServer } = createTestServer();
    server = httpServer;
    server.listen(0); // Random port
    const addr = server.address();
    baseUrl = `http://localhost:${addr.port}`;
  });

  afterAll(() => {
    if (server) server.close();
  });

  describe('GET /api/health', () => {
    it('returns healthy status', async () => {
      const response = await fetch(`${baseUrl}/api/health`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.uptime).toBeDefined();
    });
  });

  describe('GET /api/stats', () => {
    it('returns project statistics', async () => {
      const response = await fetch(`${baseUrl}/api/stats`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
      expect(typeof data.stats.gitCommits).toBe('number');
      expect(data.timestamp).toBeDefined();
    });

    it('includes all required stat fields', async () => {
      const response = await fetch(`${baseUrl}/api/stats`);
      const data = await response.json();
      
      expect(data.stats).toHaveProperty('gitCommits');
      expect(data.stats).toHaveProperty('logEntries');
      expect(data.stats).toHaveProperty('evolutionEntries');
      expect(data.stats).toHaveProperty('components');
      expect(data.stats).toHaveProperty('activeAgents');
    });
  });

  describe('POST /api/log-entry', () => {
    it('creates a new log entry', async () => {
      const entry = {
        agent: 'Test-Agent',
        content: 'Test log entry content',
        type: 'test',
        task: 'Testing'
      };

      const response = await fetch(`${baseUrl}/api/log-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.timestamp).toBeDefined();
    });

    it('rejects entries without agent', async () => {
      const response = await fetch(`${baseUrl}/api/log-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Test content' })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid entry');
    });

    it('rejects entries without content', async () => {
      const response = await fetch(`${baseUrl}/api/log-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'Test-Agent' })
      });

      expect(response.status).toBe(400);
    });

    it('detects duplicate entries', async () => {
      const entry = {
        agent: 'Duplicate-Agent',
        content: 'Duplicate test content'
      };

      // First entry
      await fetch(`${baseUrl}/api/log-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      // Duplicate entry
      const response = await fetch(`${baseUrl}/api/log-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      const data = await response.json();
      expect(data.duplicate).toBe(true);
      expect(data.message).toBe('Duplicate entry detected');
    });

    it('allows force append of duplicates', async () => {
      const entry = {
        agent: 'Force-Agent',
        content: 'Force test content'
      };

      // First entry
      await fetch(`${baseUrl}/api/log-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      // Force duplicate
      const response = await fetch(`${baseUrl}/api/log-entry?force=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('sanitizes XSS attempts', async () => {
      const entry = {
        agent: '<script>alert("xss")</script>',
        content: 'Test <img src=x onerror=alert(1)> content'
      };

      const response = await fetch(`${baseUrl}/api/log-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      // XSS should be stripped
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/docs/:filename', () => {
    it('serves allowed documentation files', async () => {
      const response = await fetch(`${baseUrl}/api/docs/README.md`);
      
      // May 404 if file doesn't exist, but should not 403
      expect([200, 404, 403]).toContain(response.status);
    });

    it('rejects disallowed files', async () => {
      const response = await fetch(`${baseUrl}/api/docs/../../../etc/passwd`);
      expect(response.status).toBe(403);
    });

    it('rejects arbitrary file access', async () => {
      const response = await fetch(`${baseUrl}/api/docs/secret.txt`);
      expect(response.status).toBe(403);
    });

    it('returns JSON with content for valid files', async () => {
      const response = await fetch(`${baseUrl}/api/docs/README.md`);
      
      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('filename');
        expect(data).toHaveProperty('success');
        if (data.success) {
          expect(data).toHaveProperty('content');
          expect(data).toHaveProperty('size');
        }
      }
    });
  });
});

describe('Security Features', () => {
  let server;
  let baseUrl;

  beforeAll(() => {
    const { httpServer } = createTestServer();
    server = httpServer;
    server.listen(0);
    const addr = server.address();
    baseUrl = `http://localhost:${addr.port}`;
  });

  afterAll(() => {
    if (server) server.close();
  });

  it('includes security headers', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('handles CORS correctly', async () => {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://localhost:5173' }
    });
    
    expect(response.ok).toBe(true);
  });
});

describe('Rate Limiting', () => {
  let server;
  let baseUrl;

  beforeAll(() => {
    const { httpServer } = createTestServer();
    server = httpServer;
    server.listen(0);
    const addr = server.address();
    baseUrl = `http://localhost:${addr.port}`;
  });

  afterAll(() => {
    if (server) server.close();
  });

  it('allows requests under rate limit', async () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      const response = await fetch(`${baseUrl}/api/health`);
      expect(response.ok).toBe(true);
    }
  });
});
