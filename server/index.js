import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

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

/**
 * POST /api/log-entry
 * Append a new entry to agent-conversation.log
 */
app.post('/api/log-entry', async (req, res) => {
  try {
    const entry = req.body;

    // Format log entry
    const logEntry = [
      `${entry.timestamp} AST`,
      `Actor: ${entry.agent}`,
      `Type: ${entry.type}`,
      entry.task ? `Task: ${entry.task}` : null,
      `Content: ${entry.content.substring(0, 500)}${entry.content.length > 500 ? '...' : ''}`,
      '---',
      ''
    ].filter(Boolean).join('\n') + '\n';

    // Append to log file
    await fs.appendFile(LOG_PATH, logEntry);

    console.log(`[LOG] New entry from ${entry.agent}`);

    // Broadcast to all connected clients
    io.emit('logUpdated', { newEntry: entry });

    res.json({
      success: true,
      message: 'Entry logged successfully',
      timestamp: entry.timestamp
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

    // Parse entries (split by ---  separator)
    const rawEntries = logContent.split('---\n').filter(e => e.trim());

    // Parse each entry
    const entries = rawEntries
      .map(raw => {
        const lines = raw.trim().split('\n');
        const entry = {};

        lines.forEach(line => {
          if (line.includes('Actor:')) {
            entry.agent = line.split('Actor:')[1].trim();
          } else if (line.includes('Type:')) {
            entry.type = line.split('Type:')[1].trim();
          } else if (line.includes('Task:')) {
            entry.task = line.split('Task:')[1].trim();
          } else if (line.includes('Content:')) {
            entry.content = line.split('Content:')[1].trim();
          } else if (line.includes('AST')) {
            entry.timestamp = line.replace(' AST', '').trim();
          }
        });

        return entry;
      })
      .filter(e => e.agent && e.content)
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
