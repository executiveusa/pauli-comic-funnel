// server/routes/brain.ts
// PAULI Second Brain API — voice chat, graph, uploads, drive, model switcher
// Connects to: Anthropic (streaming), InfraNodus MCP, Neo4j, Google Drive

import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import neo4j from 'neo4j-driver';
import multer from 'multer';
import { tmpdir } from 'os';

const router = Router();

// ── CLIENT INIT ──
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || ''
  )
);

const upload = multer({
  dest: tmpdir(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB — handles large ChatGPT/Claude exports
});

// ── MODEL REGISTRY ──
const MODELS: Record<string, { id: string; name: string; provider: string; apiKey: string }> = {
  'claude-sonnet': {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  'claude-opus': {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  'gemini-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    apiKey: process.env.GOOGLE_GEMINI_API_KEY || '',
  },
};

// ══════════════════════════════════════════════════════
// POST /api/brain/chat  — voice/text query, streaming
// ══════════════════════════════════════════════════════
router.post('/chat', async (req: Request, res: Response) => {
  const { message, model = 'claude-sonnet', sessionId, graphContext } = req.body;

  if (!message) return res.status(400).json({ error: 'message required' });

  // Fetch graph context from Neo4j if not provided
  let graphSummary = graphContext || '';
  if (!graphSummary) {
    try {
      const session = neo4jDriver.session();
      const result = await session.run(`
        MATCH (n:Node)
        OPTIONAL MATCH (n)-[r]->(m:Node)
        RETURN n.label as node, type(r) as rel, m.label as target
        LIMIT 200
      `);
      await session.close();

      const edges = result.records
        .filter(r => r.get('rel'))
        .map(r => `${r.get('node')} -[${r.get('rel')}]-> ${r.get('target')}`)
        .join('\n');

      graphSummary = `PAULI KNOWLEDGE GRAPH (excerpt):\n${edges}`;
    } catch {
      graphSummary = 'Knowledge graph unavailable — answering from training.';
    }
  }

  // System prompt — full second brain context
  const systemPrompt = `You are PAULI-PRIME, Bambu's personal AI second brain assistant.

IDENTITY:
- You have complete knowledge of Bambu's projects, companies, relationships, and frameworks
- You think in knowledge graphs — every entity has relationships, every relationship has meaning
- You are voice-first — keep responses conversational, clear, and actionable
- You always cite the graph when relevant ("Based on your graph, X connects to Y via Z")

CAPABILITIES:
- Analyze relationships between projects, people, companies, and tools
- Find gaps in the knowledge graph and suggest edges to add
- Route complex tasks to the right agent or tool
- Summarize what's happening across all active projects
- Access InfraNodus for deep topic analysis when asked

EMERALD TABLETS RULES (always follow):
- Never suggest hardcoding secrets
- Never suggest touching >3 services at once without a plan
- Quality floor 8.5/10 on everything
- 7-generation thinking: prefer compound solutions

CURRENT KNOWLEDGE GRAPH:
${graphSummary}

RESPOND:
- Conversationally for voice (short sentences, natural pauses)
- With graph paths when tracing connections: "Node A → [RELATIONSHIP] → Node B → [RELATIONSHIP] → Node C"
- With specific next actions when asked
- In English by default, Spanish if Bambu switches`;

  // SSE headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    // Use InfraNodus MCP for graph analysis queries
    const isGraphQuery = /gap|connect|path|analyz|cluster|relationship|link|between/i.test(message);

    const mcpServers = isGraphQuery ? [{
      type: 'url' as const,
      url: 'https://mcp.infranodus.com',
      name: 'infranodus',
      requestHeaders: {
        Authorization: `Bearer ${process.env.INFRANODUS_API_KEY}`,
      },
    }] : [];

    const stream = await anthropic.messages.stream({
      model: MODELS[model]?.id || 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      ...(mcpServers.length > 0 ? { mcp_servers: mcpServers } : {}),
    } as Parameters<typeof anthropic.messages.stream>[0]);

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: errMessage })}\n\n`);
    res.end();
  }
});

// ══════════════════════════════════════════════════════
// GET /api/brain/graph  — return all nodes + edges
// ══════════════════════════════════════════════════════
router.get('/graph', async (_req: Request, res: Response) => {
  const session = neo4jDriver.session();
  try {
    const nodesResult = await session.run('MATCH (n:Node) RETURN n');
    const edgesResult = await session.run(
      'MATCH (a:Node)-[r]->(b:Node) RETURN a.id as source, b.id as target, type(r) as rel'
    );

    const nodes = nodesResult.records.map(r => ({
      ...r.get('n').properties,
    }));

    const edges = edgesResult.records.map(r => ({
      source: r.get('source'),
      target: r.get('target'),
      rel: r.get('rel'),
    }));

    res.json({ nodes, edges, count: { nodes: nodes.length, edges: edges.length } });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errMessage });
  } finally {
    await session.close();
  }
});

// ══════════════════════════════════════════════════════
// GET /api/brain/graph/search?q=  — semantic search
// ══════════════════════════════════════════════════════
router.get('/graph/search', async (req: Request, res: Response) => {
  const q = String(req.query.q || '');
  if (!q) return res.json({ nodes: [] });

  const session = neo4jDriver.session();
  try {
    // Full-text search on label + description
    const result = await session.run(
      `CALL db.index.fulltext.queryNodes("node_search", $q)
       YIELD node, score
       RETURN node, score
       ORDER BY score DESC LIMIT 20`,
      { q }
    );

    const nodes = result.records.map(r => ({
      ...r.get('node').properties,
      score: r.get('score'),
    }));

    res.json({ nodes });
  } catch {
    // Fallback: simple CONTAINS search
    const result = await session.run(
      `MATCH (n:Node)
       WHERE toLower(n.label) CONTAINS toLower($q)
          OR toLower(n.desc) CONTAINS toLower($q)
       RETURN n LIMIT 20`,
      { q }
    );
    const nodes = result.records.map(r => r.get('n').properties);
    res.json({ nodes });
  } finally {
    await session.close();
  }
});

// ══════════════════════════════════════════════════════
// GET /api/brain/graph/path?from=&to=  — shortest path
// ══════════════════════════════════════════════════════
router.get('/graph/path', async (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };
  if (!from || !to) return res.status(400).json({ error: 'from and to required' });

  const session = neo4jDriver.session();
  try {
    const result = await session.run(
      `MATCH path = shortestPath(
         (a:Node {id: $from})-[*..10]-(b:Node {id: $to})
       )
       RETURN [node IN nodes(path) | node.label] as labels,
              [rel IN relationships(path) | type(rel)] as rels`,
      { from, to }
    );

    if (!result.records.length) {
      return res.json({ path: null, message: 'No path found' });
    }

    const record = result.records[0];
    const labels: string[] = record.get('labels');
    const rels: string[] = record.get('rels');

    // Build human-readable path string
    const pathStr = labels.reduce((acc, label, i) => {
      if (i === 0) return label;
      return `${acc} → [${rels[i - 1]}] → ${label}`;
    }, '');

    res.json({ path: pathStr, labels, rels, hops: rels.length });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errMessage });
  } finally {
    await session.close();
  }
});

// ══════════════════════════════════════════════════════
// POST /api/brain/upload  — ChatGPT/Claude export ingestion
// Supports: conversations.json (ChatGPT), claude-export.json,
//           PDF, TXT, MD — any file up to 500MB
// ══════════════════════════════════════════════════════
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { source = 'unknown' } = req.body; // 'chatgpt' | 'claude' | 'pdf' | 'text'
  const filePath = req.file.path;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.write(`data: ${JSON.stringify({ status: 'processing', file: req.file.originalname })}\n\n`);

  try {
    let text = '';

    if (req.file.mimetype === 'application/json' || source === 'chatgpt' || source === 'claude') {
      const { readFileSync } = await import('fs');
      const raw = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);

      // ChatGPT export format
      if (Array.isArray(data)) {
        text = data.map((conv: { title?: string; mapping?: Record<string, { message?: { content?: { parts?: string[] } } }> }) => {
          const msgs = Object.values(conv.mapping || {})
            .filter((m: { message?: { content?: { parts?: string[] } } }) => m.message?.content?.parts)
            .map((m: { message?: { content?: { parts?: string[] } } }) => m.message!.content!.parts!.join(' '))
            .join('\n');
          return `## ${conv.title || 'Conversation'}\n${msgs}`;
        }).join('\n\n');
      } else {
        // Claude export or generic JSON
        text = JSON.stringify(data, null, 2).slice(0, 100000);
      }
    } else {
      const { readFileSync } = await import('fs');
      text = readFileSync(filePath, 'utf-8').slice(0, 200000);
    }

    res.write(`data: ${JSON.stringify({ status: 'extracting', chars: text.length })}\n\n`);

    // Extract entities via Claude Haiku (cost-efficient)
    const extraction = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Extract a knowledge graph from this text. Return ONLY valid JSON with this exact structure:
{
  "nodes": [{"id": "unique-id", "label": "Name", "type": "person|project|tool|concept|company|decision", "desc": "brief description"}],
  "edges": [{"source": "node-id", "target": "node-id", "rel": "RELATIONSHIP_TYPE"}]
}

Extract maximum 50 most important nodes and their relationships. Focus on: people, projects, decisions, tools, companies, and key concepts.

TEXT:
${text.slice(0, 50000)}`,
      }],
    });

    const rawJson = extraction.content[0].type === 'text' ? extraction.content[0].text : '';
    const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON in extraction');

    const { nodes, edges } = JSON.parse(jsonMatch[0]);

    res.write(`data: ${JSON.stringify({ status: 'importing', nodes: nodes.length, edges: edges.length })}\n\n`);

    // Import into Neo4j
    const session = neo4jDriver.session();
    try {
      for (const node of nodes) {
        await session.run(
          `MERGE (n:Node {id: $id})
           SET n.label = $label, n.type = $type, n.desc = $desc, n.source = $source`,
          { ...node, source: req.file!.originalname }
        );
      }

      for (const edge of edges) {
        const relType = edge.rel.replace(/[^A-Z0-9_]/g, '_').toUpperCase();
        await session.run(
          `MATCH (a:Node {id: $source}), (b:Node {id: $target})
           MERGE (a)-[:${relType}]->(b)`,
          { source: edge.source, target: edge.target }
        );
      }
    } finally {
      await session.close();
    }

    res.write(`data: ${JSON.stringify({
      status: 'complete',
      imported: { nodes: nodes.length, edges: edges.length },
      file: req.file!.originalname,
    })}\n\n`);
    res.write('data: [DONE]\n\n');
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ status: 'error', error: errMessage })}\n\n`);
  }
  res.end();
});

// ══════════════════════════════════════════════════════
// POST /api/brain/drive  — Google Drive sync
// ══════════════════════════════════════════════════════
router.post('/drive', async (req: Request, res: Response) => {
  const { action } = req.body; // 'list' | 'sync' | 'search'

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  if (!process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
    res.write(`data: ${JSON.stringify({ error: 'Google Drive not connected. Add GOOGLE_DRIVE_REFRESH_TOKEN to Infisical.' })}\n\n`);
    return res.end();
  }

  try {
    // Get fresh access token via refresh
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_DRIVE_CLIENT_ID,
        client_secret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    const { access_token } = await tokenRes.json() as { access_token: string };

    // List recent files
    const filesRes = await fetch(
      'https://www.googleapis.com/drive/v3/files?pageSize=20&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,modifiedTime,size)',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { files } = await filesRes.json() as { files: Array<{ id: string; name: string; mimeType: string; modifiedTime: string }> };

    res.write(`data: ${JSON.stringify({ status: 'listed', count: files.length, files })}\n\n`);

    if (action === 'sync') {
      const docs = files.filter((f: { mimeType: string }) => f.mimeType === 'application/vnd.google-apps.document').slice(0, 5);
      for (const doc of docs) {
        const exportRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${doc.id}/export?mimeType=text/plain`,
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
        const text = await exportRes.text();

        res.write(`data: ${JSON.stringify({ status: 'processing', doc: doc.name })}\n\n`);

        const extraction = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Extract key entities (people, projects, decisions) from this document as JSON array:
[{"id":"slug","label":"Name","type":"concept","desc":"brief"}]
Return ONLY the JSON array. Document: ${text.slice(0, 20000)}`,
          }],
        });

        const raw = extraction.content[0].type === 'text' ? extraction.content[0].text : '[]';
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
          const nodes = JSON.parse(match[0]);
          const session = neo4jDriver.session();
          for (const node of nodes.slice(0, 20)) {
            await session.run(
              `MERGE (n:Node {id: $id}) SET n.label = $label, n.type = $type, n.desc = $desc, n.source = $source`,
              { ...node, source: `gdrive:${doc.name}` }
            );
          }
          await session.close();
        }
      }
      res.write(`data: ${JSON.stringify({ status: 'sync_complete', processed: docs.length })}\n\n`);
    }
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: errMessage })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

// ══════════════════════════════════════════════════════
// GET /api/brain/models  — list available models
// ══════════════════════════════════════════════════════
router.get('/models', (_req: Request, res: Response) => {
  const available = Object.entries(MODELS).map(([key, m]) => ({
    key,
    name: m.name,
    provider: m.provider,
    available: Boolean(m.apiKey),
  }));
  res.json({ models: available });
});

// ══════════════════════════════════════════════════════
// POST /api/brain/multimodal  — video/URL analysis
// ══════════════════════════════════════════════════════
router.post('/multimodal', async (req: Request, res: Response) => {
  const { url, type = 'youtube' } = req.body;

  if (!url) return res.status(400).json({ error: 'url required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      mcp_servers: [{
        type: 'url' as const,
        url: 'https://mcp.infranodus.com',
        name: 'infranodus',
        requestHeaders: { Authorization: `Bearer ${process.env.INFRANODUS_API_KEY}` },
      }],
      messages: [{
        role: 'user',
        content: `Use the analyze_text InfraNodus tool to analyze this ${type} URL: ${url}

        Then:
        1. Extract the main topics and their relationships
        2. Identify the top 3 insights
        3. Suggest 3 nodes and edges to add to the PAULI knowledge graph

        Return a summary I can speak out loud in under 30 seconds.`,
      }],
    } as Parameters<typeof anthropic.messages.stream>[0]);

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error';
    res.write(`data: ${JSON.stringify({ error: errMessage })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

export default router;
