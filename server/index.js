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
import chokidar from 'chokidar';
import { parseLogEntries } from './utils/parser.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic security headers without external deps
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  // Note: CSP omitted here to avoid breaking dev preview; add later if needed
  next();
});

// Project root (where agent-conversation.log lives)
const PROJECT_ROOT = path.join(__dirname, '..');

// Watch painting-estimator for changes
const PAINTING_ESTIMATOR_PATH = '/Users/skip/Documents/Active_Projects/painting-estimator';
const WATCH_FILES = [
  `${PAINTING_ESTIMATOR_PATH}/PROJECT_GUIDE.md`,
  `${PAINTING_ESTIMATOR_PATH}/agent-conversation.log`,
  `${PAINTING_ESTIMATOR_PATH}/change_log.txt`,
  `${PAINTING_ESTIMATOR_PATH}/ARCHITECTURE_EVOLUTION.md`
];

console.log(`[WATCHER] Setting up file watcher for: ${PAINTING_ESTIMATOR_PATH}`);

const watcher = chokidar.watch(WATCH_FILES, {
  persistent: true,
  ignoreInitial: true
});

watcher.on('change', (filePath) => {
  console.log(`[WATCHER] File changed: ${filePath}`);
  const content = fsSync.readFileSync(filePath, 'utf8');
  io.emit('file-update', {
    file: path.basename(filePath),
    content,
    timestamp: new Date().toISOString()
  });
});

watcher.on('add', (filePath) => {
  console.log(`[WATCHER] File added: ${filePath}`);
  const content = fsSync.readFileSync(filePath, 'utf8');
  io.emit('file-update', {
    file: path.basename(filePath),
    content,
    timestamp: new Date().toISOString()
  });
});

const LOG_PATH = path.join(PROJECT_ROOT, 'agent-conversation.log');

// In-memory recent entries for deduplication (last 100 entries)
const recentEntries = [];

// Simple in-memory rate limiter for write endpoints
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // max requests per window per IP

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  entry.count += 1;
  return false;
}

/**
 * Generate hash for content deduplication
 */
function generateHash(content, agent) {
  return crypto.createHash('sha256').update(`${agent}:${content}`).digest('hex').substring(0, 16);
}

/**
 * Basic input sanitization for log fields
 */
function sanitizeText(value, maxLen = 2000) {
  if (typeof value !== 'string') return '';
  let v = value.trim();
  // Strip script tags (basic XSS mitigation for stored content)
  v = v.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  // Remove inline event handlers like onerror=, onclick=
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

/**
 * POST /api/log-entry
 * Append a new entry to agent-conversation.log with deduplication
 */
app.post('/api/log-entry', async (req, res) => {
  try {
    // Rate limit per IP
    const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress || 'unknown').toString();
    if (isRateLimited(ip)) {
      const entry = rateLimitStore.get(ip);
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfterMs: Math.max(0, entry.resetAt - Date.now())
      });
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
      return res.status(400).json({
        success: false,
        error: 'Invalid entry: agent and content are required'
      });
    }
    const force = req.query.force === 'true'; // Force append even if duplicate

    // Generate hash for this entry
    const entryHash = generateHash(entry.content, entry.agent);

    // Check for duplicate in recent entries (within last 10 entries)
    const recentDuplicate = recentEntries.find(e => e.hash === entryHash);

    if (recentDuplicate && !force) {
      console.log(`[LOG] Duplicate detected for ${entry.agent}`);
      return res.json({
        success: false,
        duplicate: true,
        message: 'Duplicate entry detected',
        existingEntry: recentDuplicate,
        note: 'Add ?force=true to append anyway'
      });
    }

    // Format log entry
    const logEntry = [
      `${entry.timestamp} AST`,
      `Actor: ${entry.agent}`,
      `Type: ${entry.type || 'general'}`,
      entry.task ? `Task: ${entry.task}` : null,
      `Content: ${entry.content.substring(0, 500)}${entry.content.length > 500 ? '...' : ''}`,
      '---',
      ''
    ].filter(Boolean).join('\n') + '\n';

    // Append to log file
    await fs.appendFile(LOG_PATH, logEntry);

    // Add to recent entries for deduplication
    recentEntries.unshift({
      hash: entryHash,
      agent: entry.agent,
      content: entry.content.substring(0, 100),
      timestamp: entry.timestamp
    });
    // Keep only last 100 entries in memory
    if (recentEntries.length > 100) recentEntries.pop();

    console.log(`[LOG] New entry from ${entry.agent}`);

    // Broadcast to all connected clients
    io.emit('logUpdated', { newEntry: entry });

    res.json({
      success: true,
      message: 'Entry logged successfully',
      timestamp: entry.timestamp,
      hash: entryHash
    });
  } catch (err) {
    console.error('Log append error:', err);
    res.status(500).json({
      error: 'Failed to save entry',
      details: err.message
    });
  }
});

/**
 * GET /api/log-entries
 * Retrieve recent entries from agent-conversation.log
 */
app.get('/api/log-entries', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Read the log file
    const logContent = await fs.readFile(LOG_PATH, 'utf-8');

    // Parse entries using utility
    const entries = parseLogEntries(logContent)
      .reverse() // Most recent first
      .slice(0, limit);

    res.json({
      success: true,
      entries,
      total: entries.length
    });
  } catch (err) {
    console.error('Log read error:', err);
    res.status(500).json({
      error: 'Failed to read log',
      details: err.message
    });
  }
});

/**
 * GET /api/docs/:filename
 * Serve documentation files (markdown, text logs, etc.)
 */
app.get('/api/docs/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    // Security: only allow specific files
    const allowedFiles = [
      'README.md',
      'PROJECT_GUIDE.md',
      'GETTING_STARTED.md',
      'agent-conversation.log',
      'change_log.txt',
      'GITHUB_SETUP.md',
      'PUSH_TO_GITHUB.md',
      'ARCHITECTURE_EVOLUTION.md'
    ];

    if (!allowedFiles.includes(filename)) {
      return res.status(403).json({ error: 'File not allowed' });
    }

    // Try local first, then painting-estimator
    let filePath = path.join(PROJECT_ROOT, filename);
    let content;

    try {
      await fs.access(filePath);
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      // Try reading from painting-estimator
      const pePath = path.join(PAINTING_ESTIMATOR_PATH, filename);
      try {
        await fs.access(pePath);
        content = await fs.readFile(pePath, 'utf-8');
        console.log(`[DOCS] Serving ${filename} from painting-estimator`);
      } catch {
        return res.status(404).json({
          error: 'File not found',
          filename,
          message: `${filename} does not exist in this project or painting-estimator.`
        });
      }
    }

    res.json({
      success: true,
      filename,
      content,
      size: content.length,
      lastModified: (await fs.stat(filePath)).mtime
    });
  } catch (err) {
    console.error('Error serving doc:', err);
    res.status(500).json({
      error: 'Failed to read document',
      details: err.message
    });
  }
});

/**
 * GET /api/stats
 * Get real stats from LOCAL agent-dashboard-mvp project
 * Security: During isolation, ONLY read from local working directory
 * [2026-01-09] [BASEMENT-PROTOCOL] Path integrity enforced
 */
app.get('/api/stats', async (req, res) => {
  const stats = {
    gitCommits: 0,
    logEntries: 0,
    evolutionEntries: 0,
    components: 0,
    activeAgents: 0
  };

  const safeRead = async (fn, fallback = 0) => {
    try {
      return await fn();
    } catch (err) {
      console.warn('[STATS] Fallback used:', err.message);
      return fallback;
    }
  };

  // Git commits from LOCAL repo (agent-dashboard-mvp)
  stats.gitCommits = await safeRead(async () => {
    const { stdout } = await execAsync('git rev-list --count HEAD', { cwd: PROJECT_ROOT });
    return parseInt(stdout.trim(), 10) || 0;
  });

  // Log entries from LOCAL agent-conversation.log
  const logContent = await safeRead(async () => await fs.readFile(LOG_PATH, 'utf8'), '');

  stats.logEntries = logContent
    ? logContent.split('---').filter(e => e.trim() && e.includes('Actor:')).length
    : 0;

  stats.activeAgents = logContent
    ? (() => {
        const actors = new Set();
        const actorMatches = logContent.matchAll(/Actor:\s*([^\n]+)/g);
        for (const match of actorMatches) actors.add(match[1].trim());
        return actors.size;
      })()
    : 0;

  // Evolution entries from LOCAL COMPREHENSIVE_REVIEW.md (if exists)
  const evolutionContent = await safeRead(async () => await fs.readFile(path.join(PROJECT_ROOT, 'COMPREHENSIVE_REVIEW.md'), 'utf8'), '');
  stats.evolutionEntries = evolutionContent
    ? evolutionContent.split('\n').filter(l => l.includes('##') || l.includes('###')).length
    : 0;

  // Components from LOCAL src/ directory
  stats.components = await safeRead(async () => {
    const srcPath = path.join(PROJECT_ROOT, 'src');
    const entries = await fs.readdir(srcPath, { withFileTypes: true });
    return entries.filter(f => f.isFile() && (f.name.endsWith('.jsx') || f.name.endsWith('.js'))).length;
  });

  res.json({
    success: true,
    stats,
    timestamp: new Date().toISOString(),
    source: 'agent-dashboard-mvp (local)'
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * WebSocket connection handler
 */
io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });

  // Client requests log updates
  socket.on('requestLogUpdate', async () => {
    try {
      const response = await fetch('http://localhost:3001/api/log-entries?limit=10');
      const data = await response.json();
      socket.emit('logData', data);
    } catch (err) {
      console.error('Error fetching log data:', err);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  🚀 Agent Dashboard Backend Server                     ║
╠════════════════════════════════════════════════════════╣
║  HTTP Server:    http://localhost:${PORT}                   ║
║  WebSocket:      ws://localhost:${PORT}                     ║
║  Log File:       agent-conversation.log                ║
║  Status:         Ready for agent coordination          ║
╚════════════════════════════════════════════════════════╝
  `);

  console.log(`[INFO] Watching log file: ${LOG_PATH}`);
  console.log(`[INFO] CORS enabled for: http://localhost:5173`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('[INFO] Server closed');
    process.exit(0);
  });
});
