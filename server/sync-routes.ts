/**
 * ByteRover Sync API Routes
 * 
 * Endpoints for Triple-Sync management:
 * - GET /api/sync/status - Get sync status for all targets
 * - POST /api/sync/force - Force sync all targets
 * - POST /api/sync/webhook/github - GitHub webhook handler
 * - POST /api/sync/webhook/notion - Notion webhook handler
 * - POST /api/sync/webhook/voice - Voice (VAPI) webhook handler
 */

import express, { Request, Response, Router } from 'express';
import { getSyncEngine } from './services/sync-engine';
import { 
  watcherManager, 
  FilesystemWatcher, 
  EmailWatcher, 
  VoiceWatcher, 
  GitHubWatcher, 
  GoogleDriveWatcher 
} from '../agents/watchers';
import crypto from 'crypto';

const router: Router = express.Router();

// =====================================================
// SYNC STATUS
// =====================================================

router.get('/sync/status', async (_req: Request, res: Response) => {
  try {
    const syncEngine = getSyncEngine();
    const status = await syncEngine.getStatus();
    const watcherStatus = watcherManager.getStatus();

    res.json({
      success: true,
      sync: status,
      watchers: watcherStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// =====================================================
// FORCE SYNC
// =====================================================

router.post('/sync/force', async (_req: Request, res: Response) => {
  try {
    const syncEngine = getSyncEngine();
    const result = await syncEngine.forceSync();

    res.json({
      success: result.success,
      synced: result.synced,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Force sync error:', error);
    res.status(500).json({ error: 'Failed to force sync' });
  }
});

// =====================================================
// GITHUB WEBHOOK
// =====================================================

router.post('/sync/webhook/github', async (req: Request, res: Response) => {
  try {
    // Verify GitHub signature
    const signature = req.headers['x-hub-signature-256'];
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
      if (signature !== digest) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = req.headers['x-github-event'];
    const payload = req.body;

    console.log(`📥 GitHub webhook: ${event}`);

    const syncEngine = getSyncEngine();

    switch (event) {
      case 'push':
        // Handle push events - sync changes to Notion
        for (const commit of payload.commits || []) {
          syncEngine.queueEvent({
            source: 'github',
            target: 'notion',
            operation: 'sync',
            data: {
              sha: commit.id,
              message: commit.message,
              author: commit.author?.name,
              timestamp: commit.timestamp,
              added: commit.added,
              modified: commit.modified,
              removed: commit.removed,
            },
          });
        }
        break;

      case 'pull_request':
        // Handle PR events
        syncEngine.queueEvent({
          source: 'github',
          target: 'notion',
          operation: payload.action === 'opened' ? 'create' : 'update',
          data: {
            prNumber: payload.pull_request?.number,
            title: payload.pull_request?.title,
            body: payload.pull_request?.body,
            state: payload.pull_request?.state,
            author: payload.pull_request?.user?.login,
          },
        });
        break;

      case 'issues':
        // Handle issue events
        syncEngine.queueEvent({
          source: 'github',
          target: 'notion',
          operation: payload.action === 'opened' ? 'create' : 'update',
          data: {
            issueNumber: payload.issue?.number,
            title: payload.issue?.title,
            body: payload.issue?.body,
            state: payload.issue?.state,
            labels: payload.issue?.labels?.map((l: { name: string }) => l.name),
          },
        });
        break;
    }

    res.json({ success: true, event });
  } catch (error) {
    console.error('GitHub webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// =====================================================
// NOTION WEBHOOK (Notion doesn't have native webhooks, use polling or Zapier)
// =====================================================

router.post('/sync/webhook/notion', async (req: Request, res: Response) => {
  try {
    // This endpoint would be called by Zapier/Make when Notion changes
    const { databaseId, pageId, action, properties } = req.body;

    console.log(`📥 Notion webhook: ${action} on ${pageId}`);

    const syncEngine = getSyncEngine();

    syncEngine.queueEvent({
      source: 'notion',
      target: 'github',
      operation: action === 'created' ? 'create' : 'update',
      data: {
        databaseId,
        pageId,
        properties,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Notion webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// =====================================================
// VOICE WEBHOOK (VAPI)
// =====================================================

router.post('/sync/webhook/voice', async (req: Request, res: Response) => {
  try {
    // Verify VAPI signature if configured
    const signature = req.headers['x-vapi-signature'];
    const secret = process.env.VAPI_WEBHOOK_SECRET;

    if (secret && signature) {
      // VAPI uses HMAC-SHA256
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
      if (signature !== digest) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { type, transcript, confidence, timestamp, metadata } = req.body;

    console.log(`📥 Voice webhook: ${type}`);

    // Get voice watcher instance and process
    const voiceWatcher = watcherManager.watchers?.get('voice') as VoiceWatcher | undefined;
    
    if (voiceWatcher) {
      await voiceWatcher.processVoiceEvent({
        type: type || 'transcription',
        transcript: transcript || '',
        confidence,
        timestamp: new Date(timestamp || Date.now()),
        metadata,
      });
    } else {
      // Fallback - queue directly to sync engine
      const syncEngine = getSyncEngine();
      syncEngine.queueEvent({
        source: 'local',
        target: 'notion',
        operation: 'create',
        data: {
          type: 'voice_event',
          eventType: type,
          transcript,
          confidence,
          timestamp,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Voice webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// =====================================================
// WATCHER MANAGEMENT
// =====================================================

router.post('/sync/watchers/start', async (_req: Request, res: Response) => {
  try {
    await watcherManager.startAll();
    res.json({ success: true, message: 'All watchers started' });
  } catch (error) {
    console.error('Start watchers error:', error);
    res.status(500).json({ error: 'Failed to start watchers' });
  }
});

router.post('/sync/watchers/stop', async (_req: Request, res: Response) => {
  try {
    watcherManager.stopAll();
    res.json({ success: true, message: 'All watchers stopped' });
  } catch (error) {
    console.error('Stop watchers error:', error);
    res.status(500).json({ error: 'Failed to stop watchers' });
  }
});

router.get('/sync/watchers/status', async (_req: Request, res: Response) => {
  try {
    const status = watcherManager.getStatus();
    res.json({ success: true, watchers: status });
  } catch (error) {
    console.error('Watcher status error:', error);
    res.status(500).json({ error: 'Failed to get watcher status' });
  }
});

// =====================================================
// INITIALIZE WATCHERS
// =====================================================

export function initializeWatchers(): void {
  console.log('🔧 Initializing watchers...');

  // Filesystem watcher
  if (process.env.WATCH_PATH) {
    watcherManager.register('filesystem', new FilesystemWatcher({
      watchPath: process.env.WATCH_PATH,
      debounceMs: 1000,
      excludePatterns: ['node_modules', '.git', 'dist', '*.log'],
    }));
  }

  // GitHub watcher
  if (process.env.GITHUB_TOKEN) {
    watcherManager.register('github', new GitHubWatcher({
      pollInterval: 5000,
    }));
  }

  // Google Drive watcher
  if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
    watcherManager.register('google_drive', new GoogleDriveWatcher({
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
      pollInterval: 86400000, // Daily
    }));
  }

  // Email watcher
  if (process.env.EMAIL_PROVIDER && process.env.EMAIL_USER) {
    watcherManager.register('email', new EmailWatcher({
      provider: process.env.EMAIL_PROVIDER as 'gmail' | 'outlook' | 'imap',
      credentials: {
        user: process.env.EMAIL_USER,
        accessToken: process.env.EMAIL_ACCESS_TOKEN,
      },
      pollInterval: 60000, // 1 minute
    }));
  }

  // Voice watcher
  if (process.env.VAPI_API_KEY) {
    watcherManager.register('voice', new VoiceWatcher({
      provider: 'vapi',
      apiKey: process.env.VAPI_API_KEY,
      assistantId: process.env.VAPI_ASSISTANT_ID,
    }));
  }

  console.log('✅ Watchers initialized');
}

export default router;
