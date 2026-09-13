import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const prisma = new PrismaClient();
const anthropic = new Anthropic();

// Basic health check
router.get('/health', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const isProduction = process.env.NODE_ENV === 'production';

  const checks: {
    api: string;
    database: string;
    anthropic: string;
    timestamp: string;
    uptime: number;
    memory?: NodeJS.MemoryUsage;
    env?: string;
  } = {
    api: 'ok',
    database: 'unknown',
    anthropic: 'unknown',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  // Only expose memory/env in non-production
  if (!isProduction) {
    checks.memory = process.memoryUsage();
    checks.env = process.env.NODE_ENV || 'development';
  }

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
    console.error('Database health check failed:', error);
  }

  // Anthropic API check
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      checks.anthropic = 'ok';
    } else {
      checks.anthropic = 'missing_key';
    }
  } catch (error) {
    checks.anthropic = 'error';
  }

  const responseTime = Date.now() - startTime;
  const isHealthy = checks.database === 'ok' && checks.anthropic === 'ok';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'pauli-effect-api',
    version: process.env.npm_package_version || '1.0.0',
    checks,
    responseTime: `${responseTime}ms`,
  });
});

// Readiness check (for Kubernetes/Railway)
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false, error: 'Database not ready' });
  }
});

// Liveness check (for Kubernetes/Railway)
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

// Metrics endpoint (Prometheus-compatible)
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const [
      emailCount,
      conversationCount,
      messageCount,
      eventCount,
    ] = await Promise.all([
      prisma.emailCapture.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.analyticsEvent.count(),
    ]);

    const metrics = [
      `# HELP pauli_emails_total Total number of email captures`,
      `# TYPE pauli_emails_total counter`,
      `pauli_emails_total ${emailCount}`,
      ``,
      `# HELP pauli_conversations_total Total number of conversations`,
      `# TYPE pauli_conversations_total counter`,
      `pauli_conversations_total ${conversationCount}`,
      ``,
      `# HELP pauli_messages_total Total number of messages`,
      `# TYPE pauli_messages_total counter`,
      `pauli_messages_total ${messageCount}`,
      ``,
      `# HELP pauli_events_total Total number of analytics events`,
      `# TYPE pauli_events_total counter`,
      `pauli_events_total ${eventCount}`,
      ``,
      `# HELP pauli_uptime_seconds Application uptime in seconds`,
      `# TYPE pauli_uptime_seconds gauge`,
      `pauli_uptime_seconds ${process.uptime()}`,
    ].join('\n');

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('# Error generating metrics\n');
  }
});

export default router;
