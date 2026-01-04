/**
 * ByteRover Sync Engine
 * Implements Triple-Sync: GitHub ↔ Notion ↔ Google Cloud
 * 
 * This is the core sync service that orchestrates data flow between:
 * - GitHub (source of truth)
 * - Notion (structured knowledge base)
 * - Google Cloud Storage (7-generation archive)
 * - Local filesystem (development)
 */

import { Client as NotionClient } from '@notionhq/client';
import { Octokit } from '@octokit/rest';
import { PrismaClient } from '@prisma/client';

// Types
export interface SyncEvent {
  id: string;
  source: 'github' | 'notion' | 'google_cloud' | 'local' | 'google_drive';
  target: 'github' | 'notion' | 'google_cloud' | 'local';
  operation: 'create' | 'update' | 'delete' | 'sync';
  status: 'pending' | 'success' | 'failed' | 'conflict';
  data: Record<string, unknown>;
  timestamp: Date;
  error?: string;
}

export interface WatcherConfig {
  name: string;
  enabled: boolean;
  source: SyncEvent['source'];
  interval?: number; // ms
  onEvent: (event: SyncEvent) => Promise<void>;
}

export interface SyncConfig {
  conflictResolution: 'github_wins' | 'notion_wins' | 'newest_wins' | 'manual';
  syncInterval: number; // ms
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: SyncConfig = {
  conflictResolution: 'github_wins',
  syncInterval: 15 * 60 * 1000, // 15 minutes
  retryPolicy: {
    maxRetries: 3,
    backoffMs: 1000,
  },
};

export class ByteRoverSyncEngine {
  private notion: NotionClient | null = null;
  private github: Octokit | null = null;
  private prisma: PrismaClient;
  private config: SyncConfig;
  private watchers: Map<string, WatcherConfig> = new Map();
  private syncQueue: SyncEvent[] = [];
  private isRunning = false;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.prisma = new PrismaClient();
    this.initializeClients();
  }

  private initializeClients(): void {
    // Initialize Notion client
    if (process.env.NOTION_API_KEY) {
      this.notion = new NotionClient({ auth: process.env.NOTION_API_KEY });
      console.log('✅ Notion client initialized');
    } else {
      console.warn('⚠️ NOTION_API_KEY not set - Notion sync disabled');
    }

    // Initialize GitHub client
    if (process.env.GITHUB_TOKEN) {
      this.github = new Octokit({ auth: process.env.GITHUB_TOKEN });
      console.log('✅ GitHub client initialized');
    } else {
      console.warn('⚠️ GITHUB_TOKEN not set - GitHub sync disabled');
    }
  }

  /**
   * Register a watcher for a specific source
   */
  registerWatcher(watcher: WatcherConfig): void {
    this.watchers.set(watcher.name, watcher);
    console.log(`📡 Watcher registered: ${watcher.name} (${watcher.source})`);
  }

  /**
   * Start the sync engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Sync engine already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 ByteRover Sync Engine started');

    // Start all watchers
    for (const [name, watcher] of this.watchers) {
      if (watcher.enabled && watcher.interval) {
        this.startWatcherLoop(watcher);
      }
    }

    // Start sync queue processor
    this.processSyncQueue();
  }

  /**
   * Stop the sync engine
   */
  stop(): void {
    this.isRunning = false;
    console.log('🛑 ByteRover Sync Engine stopped');
  }

  /**
   * Queue a sync event
   */
  queueEvent(event: Omit<SyncEvent, 'id' | 'timestamp' | 'status'>): string {
    const fullEvent: SyncEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      status: 'pending',
    };
    this.syncQueue.push(fullEvent);
    console.log(`📥 Event queued: ${fullEvent.source} → ${fullEvent.target} (${fullEvent.operation})`);
    return fullEvent.id;
  }

  /**
   * Sync GitHub changes to Notion
   */
  async syncGitHubToNotion(data: { path: string; content: string; sha: string }): Promise<void> {
    if (!this.notion) throw new Error('Notion client not initialized');

    const projectsDbId = process.env.NOTION_DATABASE_PROJECTS;
    if (!projectsDbId) throw new Error('NOTION_DATABASE_PROJECTS not set');

    // Check if this file already has a Notion page
    const existingSync = await this.prisma.notionSync.findFirst({
      where: { recordId: data.sha },
    });

    if (existingSync) {
      // Update existing page
      await this.notion.pages.update({
        page_id: existingSync.notionPageId,
        properties: {
          'Content': {
            rich_text: [{ text: { content: data.content.substring(0, 2000) } }],
          },
          'Last Synced': {
            date: { start: new Date().toISOString() },
          },
        },
      });
      console.log(`📝 Updated Notion page for ${data.path}`);
    } else {
      // Create new page
      const page = await this.notion.pages.create({
        parent: { database_id: projectsDbId },
        properties: {
          'Name': {
            title: [{ text: { content: data.path } }],
          },
          'Content': {
            rich_text: [{ text: { content: data.content.substring(0, 2000) } }],
          },
          'Source': {
            select: { name: 'GitHub' },
          },
          'Last Synced': {
            date: { start: new Date().toISOString() },
          },
        },
      });

      await this.prisma.notionSync.create({
        data: {
          tableName: 'GitHubFile',
          recordId: data.sha,
          notionPageId: page.id,
          syncStatus: 'SUCCESS',
        },
      });
      console.log(`✅ Created Notion page for ${data.path}`);
    }
  }

  /**
   * Sync Notion changes to GitHub
   */
  async syncNotionToGitHub(data: { pageId: string; title: string; content: string }): Promise<void> {
    if (!this.github) throw new Error('GitHub client not initialized');

    const owner = process.env.GITHUB_ORG || 'executiveusa';
    const repo = 'pauli-comic-funnel';
    const path = `notion-sync/${data.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;

    try {
      // Check if file exists
      let sha: string | undefined;
      try {
        const existing = await this.github.repos.getContent({ owner, repo, path });
        if ('sha' in existing.data) {
          sha = existing.data.sha;
        }
      } catch (e) {
        // File doesn't exist, that's fine
      }

      // Create or update file
      await this.github.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `🤖 [AUTO-SYNC] ${sha ? 'Update' : 'Create'} ${data.title}`,
        content: Buffer.from(data.content).toString('base64'),
        sha,
      });

      console.log(`✅ Synced to GitHub: ${path}`);
    } catch (error) {
      console.error('GitHub sync error:', error);
      throw error;
    }
  }

  /**
   * Get sync status for all targets
   */
  async getStatus(): Promise<Record<string, { connected: boolean; lastSync?: Date; pendingEvents: number }>> {
    const pendingByTarget = this.syncQueue.reduce((acc, event) => {
      acc[event.target] = (acc[event.target] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      github: {
        connected: !!this.github,
        pendingEvents: pendingByTarget['github'] || 0,
      },
      notion: {
        connected: !!this.notion,
        pendingEvents: pendingByTarget['notion'] || 0,
      },
      google_cloud: {
        connected: !!process.env.GOOGLE_CLOUD_CREDENTIALS,
        pendingEvents: pendingByTarget['google_cloud'] || 0,
      },
    };
  }

  /**
   * Force sync all targets
   */
  async forceSync(): Promise<{ success: boolean; synced: string[]; errors: string[] }> {
    const synced: string[] = [];
    const errors: string[] = [];

    // Sync GitHub → Notion
    if (this.notion && this.github) {
      try {
        // Fetch recent commits
        const { data: commits } = await this.github.repos.listCommits({
          owner: process.env.GITHUB_ORG || 'executiveusa',
          repo: 'pauli-comic-funnel',
          per_page: 10,
        });

        for (const commit of commits) {
          this.queueEvent({
            source: 'github',
            target: 'notion',
            operation: 'sync',
            data: { sha: commit.sha, message: commit.commit.message },
          });
        }
        synced.push('github_to_notion');
      } catch (e) {
        errors.push(`github_to_notion: ${e}`);
      }
    }

    return {
      success: errors.length === 0,
      synced,
      errors,
    };
  }

  // Private methods

  private async processSyncQueue(): Promise<void> {
    while (this.isRunning) {
      if (this.syncQueue.length > 0) {
        const event = this.syncQueue.shift()!;
        await this.processEvent(event);
      }
      await this.sleep(1000); // Check queue every second
    }
  }

  private async processEvent(event: SyncEvent): Promise<void> {
    let retries = 0;
    
    while (retries < this.config.retryPolicy.maxRetries) {
      try {
        switch (`${event.source}_to_${event.target}`) {
          case 'github_to_notion':
            await this.syncGitHubToNotion(event.data as { path: string; content: string; sha: string });
            break;
          case 'notion_to_github':
            await this.syncNotionToGitHub(event.data as { pageId: string; title: string; content: string });
            break;
          default:
            console.warn(`Unknown sync path: ${event.source} → ${event.target}`);
        }
        
        event.status = 'success';
        console.log(`✅ Sync complete: ${event.id}`);
        return;
      } catch (error) {
        retries++;
        event.error = String(error);
        console.error(`❌ Sync failed (attempt ${retries}): ${error}`);
        await this.sleep(this.config.retryPolicy.backoffMs * retries);
      }
    }

    event.status = 'failed';
    console.error(`❌ Sync permanently failed after ${retries} retries: ${event.id}`);
  }

  private startWatcherLoop(watcher: WatcherConfig): void {
    const loop = async () => {
      while (this.isRunning && watcher.enabled) {
        try {
          // Trigger watcher
          const event: SyncEvent = {
            id: crypto.randomUUID(),
            source: watcher.source,
            target: 'notion', // Default target, watcher can override
            operation: 'sync',
            status: 'pending',
            data: {},
            timestamp: new Date(),
          };
          await watcher.onEvent(event);
        } catch (error) {
          console.error(`Watcher ${watcher.name} error:`, error);
        }
        await this.sleep(watcher.interval!);
      }
    };
    loop();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let syncEngine: ByteRoverSyncEngine | null = null;

export function getSyncEngine(): ByteRoverSyncEngine {
  if (!syncEngine) {
    syncEngine = new ByteRoverSyncEngine();
  }
  return syncEngine;
}

export default ByteRoverSyncEngine;
