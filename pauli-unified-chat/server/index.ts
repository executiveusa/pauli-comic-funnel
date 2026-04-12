import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { AgentOrchestrator } from './agent/orchestrator.js';
import { RTKHook } from './hooks/rtk.js';
import { FlywheelEngine } from './flywheel/engine.js';
import { MCPIntegration } from './mcp/integration.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Initialize systems
const rtk = new RTKHook();
const mcp = new MCPIntegration();
const flywheel = new FlywheelEngine();
const agent = new AgentOrchestrator({ rtk, mcp, flywheel });

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, userId } = req.body;
  try {
    const response = await agent.processMessage(message, userId);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// WebSocket chat (real-time streaming)
wss.on('connection', (ws, req) => {
  const userId = new URL(req.url || '', 'http://localhost').searchParams.get('userId') || 'anonymous';
  console.log(`Client connected: ${userId}`);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'message') {
        // Stream response chunks as they arrive
        for await (const chunk of agent.streamMessage(message.content, userId)) {
          ws.send(JSON.stringify({ type: 'chunk', content: chunk }));
        }
        ws.send(JSON.stringify({ type: 'complete' }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', content: String(error) }));
    }
  });

  ws.on('close', () => console.log(`Client disconnected: ${userId}`));
});

// Projects endpoint (with RTK optimization)
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await agent.listProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Execute plan endpoint
app.post('/api/execute', async (req, res) => {
  const { manifestId } = req.body;
  try {
    const manifest = (flywheel as any).manifests?.get(manifestId);
    if (!manifest) throw new Error('Manifest not found');
    const result = await flywheel.executePlan(manifestId, manifest.steps);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 PAULI Unified Chat running on port ${PORT}`);
  console.log(`💬 Chat at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ready for real-time streaming`);
});
