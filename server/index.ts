import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';
import copilotKitRoutes from './copilotkit-routes';
import agiOpenRoutes from './agi-open-routes';
import { enforceCopilotKitUsage, redirectToCopilotKit, logFrontendGeneration } from './middleware/enforce-copilotkit';

const app = express();
const prisma = new PrismaClient();
const anthropic = new Anthropic();
const notion = new Client({ auth: process.env.NOTION_API_TOKEN });

app.use(cors());
app.use(express.json());

// Middleware: Log frontend generation and enforce CopilotKit usage
app.use(logFrontendGeneration);
app.use(redirectToCopilotKit);
app.use(enforceCopilotKitUsage);

// CopilotKit API routes (rebranded as Pauli Agent UI)
app.use('/api', copilotKitRoutes);

// AGI Open routes (computer-use automation)
app.use('/api/agi-open', agiOpenRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'pauli-effect-api' });
});

// =====================================================
// EMAIL CAPTURE ENDPOINTS
// =====================================================

app.post('/api/email/capture', async (req: Request, res: Response) => {
  try {
    const { email, name, source, referrer, utmSource, utmMedium, utmCampaign } = req.body;
    
    const capture = await prisma.emailCapture.create({
      data: {
        email,
        name,
        source: source || 'landing',
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      },
    });

    syncToNotion(capture).catch(console.error);

    res.json({ success: true, id: capture.id });
  } catch (error) {
    console.error('Email capture error:', error);
    res.status(500).json({ error: 'Failed to capture email' });
  }
});

app.get('/api/email/captures', async (_req: Request, res: Response) => {
  try {
    const captures = await prisma.emailCapture.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(captures);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch captures' });
  }
});

// =====================================================
// COMIC ENDPOINTS
// =====================================================

app.get('/api/comics', async (_req: Request, res: Response) => {
  try {
    const episodes = await prisma.comicEpisode.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { orderIndex: 'asc' },
      include: { panels: { orderBy: { orderIndex: 'asc' } } },
    });
    res.json(episodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comics' });
  }
});

app.get('/api/comics/:slug', async (req: Request, res: Response) => {
  try {
    const episode = await prisma.comicEpisode.findUnique({
      where: { slug: req.params.slug },
      include: { panels: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!episode) return res.status(404).json({ error: 'Episode not found' });
    res.json(episode);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch episode' });
  }
});

// =====================================================
// AI CHAT ENDPOINTS
// =====================================================

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body;

    let conversation = await prisma.conversation.findFirst({
      where: { sessionId, status: 'ACTIVE' },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({ data: { sessionId } });
    }

    await prisma.message.create({
      data: { conversationId: conversation.id, role: 'USER', content: message },
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are PAULI, the AI assistant for THE PAULI EFFECT comic series. Help readers understand physics concepts, navigate the story, and answer questions. Be friendly and enthusiastic about science.`,
      messages: [{ role: 'user', content: message }],
    });

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: assistantMessage,
        tokens: response.usage?.output_tokens,
      },
    });

    res.json({ message: assistantMessage, conversationId: conversation.id });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

// =====================================================
// ANALYTICS ENDPOINTS
// =====================================================

app.post('/api/analytics/event', async (req: Request, res: Response) => {
  try {
    const { eventType, eventData, userId, sessionId, pageUrl, referrer } = req.body;
    
    await prisma.analyticsEvent.create({
      data: {
        eventType, eventData, userId, sessionId, pageUrl, referrer,
        userAgent: req.get('User-Agent') || null,
        ipAddress: req.ip || null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// =====================================================
// RETOOL DASHBOARD API ENDPOINTS
// =====================================================

app.get('/api/retool/dashboard', async (_req: Request, res: Response) => {
  try {
    const [totalEmails, todayEmails, totalEvents, totalConversations, recentCaptures] = await Promise.all([
      prisma.emailCapture.count(),
      prisma.emailCapture.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.analyticsEvent.count(),
      prisma.conversation.count(),
      prisma.emailCapture.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    res.json({ totalEmails, todayEmails, totalEvents, totalConversations, recentCaptures });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

app.get('/api/retool/emails', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [emails, total] = await Promise.all([
      prisma.emailCapture.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.emailCapture.count(),
    ]);

    res.json({ emails, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

app.get('/api/retool/analytics', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: { createdAt: { gte: startDate } },
      _count: { eventType: true },
    });

    const dailyCaptures = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM "EmailCapture"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    res.json({ eventsByType: events, dailyCaptures });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/retool/conversations', async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// =====================================================
// NOTION SYNC
// =====================================================

async function syncToNotion(capture: { id: string; email: string; name: string | null; source: string; createdAt: Date }) {
  if (!process.env.NOTION_DATABASE_ID) return;

  try {
    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Email: { title: [{ text: { content: capture.email } }] },
        Name: { rich_text: [{ text: { content: capture.name || '' } }] },
        Source: { select: { name: capture.source } },
        'Created At': { date: { start: capture.createdAt.toISOString() } },
      },
    });

    await prisma.emailCapture.update({
      where: { id: capture.id },
      data: { notionPageId: page.id, notionSynced: true, notionSyncedAt: new Date() },
    });

    await prisma.notionSync.create({
      data: { tableName: 'EmailCapture', recordId: capture.id, notionPageId: page.id, syncStatus: 'SUCCESS' },
    });
  } catch (error) {
    console.error('Notion sync error:', error);
    await prisma.notionSync.create({
      data: { tableName: 'EmailCapture', recordId: capture.id, notionPageId: '', syncStatus: 'FAILED', errorMessage: String(error) },
    });
  }
}

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Pauli Effect API running on port ${PORT}`);
});

export default app;
