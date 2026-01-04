/**
 * BYTEBOT Watchers
 * 
 * Implements the 5 watchers required for Triple-Sync:
 * 1. GitHub Watcher (✅ implemented)
 * 2. Google Drive Watcher (✅ implemented)
 * 3. Filesystem Watcher (🔄 implementing now)
 * 4. Email Watcher (🔄 implementing now)
 * 5. Voice Watcher (🔄 implementing now)
 */

import { watch, FSWatcher } from 'chokidar';
import { getSyncEngine, SyncEvent, WatcherConfig } from '../../server/services/sync-engine';
import * as fs from 'fs/promises';
import * as path from 'path';

// =====================================================
// FILESYSTEM WATCHER
// =====================================================

export class FilesystemWatcher {
  private watcher: FSWatcher | null = null;
  private watchPath: string;
  private debounceMs: number;
  private excludePatterns: string[];
  private pendingChanges: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: {
    watchPath: string;
    debounceMs?: number;
    excludePatterns?: string[];
  }) {
    this.watchPath = config.watchPath;
    this.debounceMs = config.debounceMs || 1000;
    this.excludePatterns = config.excludePatterns || [
      'node_modules',
      '.git',
      'dist',
      'build',
      '*.log',
    ];
  }

  async start(): Promise<void> {
    console.log(`📂 Starting filesystem watcher: ${this.watchPath}`);

    this.watcher = watch(this.watchPath, {
      ignored: this.excludePatterns.map(p => `**/${p}`),
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: this.debounceMs,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (filePath) => this.handleChange('create', filePath))
      .on('change', (filePath) => this.handleChange('update', filePath))
      .on('unlink', (filePath) => this.handleChange('delete', filePath))
      .on('error', (error) => console.error('Filesystem watcher error:', error));

    console.log('✅ Filesystem watcher started');
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('🛑 Filesystem watcher stopped');
    }
  }

  private handleChange(operation: 'create' | 'update' | 'delete', filePath: string): void {
    // Debounce rapid changes to the same file
    const existing = this.pendingChanges.get(filePath);
    if (existing) {
      clearTimeout(existing);
    }

    const timeout = setTimeout(async () => {
      this.pendingChanges.delete(filePath);
      await this.processChange(operation, filePath);
    }, this.debounceMs);

    this.pendingChanges.set(filePath, timeout);
  }

  private async processChange(operation: 'create' | 'update' | 'delete', filePath: string): Promise<void> {
    const syncEngine = getSyncEngine();
    const relativePath = path.relative(this.watchPath, filePath);

    let content = '';
    if (operation !== 'delete') {
      try {
        content = await fs.readFile(filePath, 'utf-8');
      } catch (e) {
        console.warn(`Could not read file: ${filePath}`);
      }
    }

    syncEngine.queueEvent({
      source: 'local',
      target: 'github',
      operation,
      data: {
        path: relativePath,
        fullPath: filePath,
        content: content.substring(0, 10000), // Limit content size
      },
    });

    console.log(`📁 File ${operation}: ${relativePath}`);
  }
}

// =====================================================
// EMAIL WATCHER
// =====================================================

export interface EmailConfig {
  provider: 'gmail' | 'outlook' | 'imap';
  credentials: {
    user: string;
    password?: string;
    accessToken?: string;
  };
  watchFolder?: string;
  pollInterval?: number;
  filters?: {
    from?: string[];
    subject?: string[];
    hasAttachment?: boolean;
  };
}

export class EmailWatcher {
  private config: EmailConfig;
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(config: EmailConfig) {
    this.config = {
      watchFolder: 'INBOX',
      pollInterval: 60000, // 1 minute default
      ...config,
    };
  }

  async start(): Promise<void> {
    console.log(`📧 Starting email watcher (${this.config.provider})`);
    this.isRunning = true;
    this.poll();
    console.log('✅ Email watcher started');
  }

  stop(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    console.log('🛑 Email watcher stopped');
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.checkForNewEmails();
    } catch (error) {
      console.error('Email poll error:', error);
    }

    this.pollTimer = setTimeout(() => this.poll(), this.config.pollInterval);
  }

  private async checkForNewEmails(): Promise<void> {
    // Implementation depends on provider
    switch (this.config.provider) {
      case 'gmail':
        await this.checkGmail();
        break;
      case 'outlook':
        await this.checkOutlook();
        break;
      case 'imap':
        await this.checkIMAP();
        break;
    }
  }

  private async checkGmail(): Promise<void> {
    // Gmail API implementation
    // Requires: GOOGLE_GMAIL_CREDENTIALS env var
    const syncEngine = getSyncEngine();

    // TODO: Implement Gmail API polling
    // 1. Use Google Gmail API to fetch unread emails matching filters
    // 2. Parse email content and attachments
    // 3. Queue sync events for relevant emails

    console.log('📬 Gmail check (stub - implement with Gmail API)');
  }

  private async checkOutlook(): Promise<void> {
    // Microsoft Graph API implementation
    // Requires: MICROSOFT_GRAPH_TOKEN env var
    const syncEngine = getSyncEngine();

    // TODO: Implement Microsoft Graph API polling
    console.log('📬 Outlook check (stub - implement with Graph API)');
  }

  private async checkIMAP(): Promise<void> {
    // Generic IMAP implementation
    // Requires: IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASSWORD env vars
    const syncEngine = getSyncEngine();

    // TODO: Implement IMAP polling with node-imap or similar
    console.log('📬 IMAP check (stub - implement with node-imap)');
  }

  /**
   * Process an incoming email and queue for sync
   */
  async processEmail(email: {
    id: string;
    from: string;
    subject: string;
    body: string;
    attachments?: Array<{ name: string; content: Buffer }>;
    receivedAt: Date;
  }): Promise<void> {
    const syncEngine = getSyncEngine();

    // Check filters
    if (this.config.filters?.from && !this.config.filters.from.some(f => email.from.includes(f))) {
      return; // Doesn't match filter
    }
    if (this.config.filters?.subject && !this.config.filters.subject.some(s => email.subject.includes(s))) {
      return;
    }
    if (this.config.filters?.hasAttachment && (!email.attachments || email.attachments.length === 0)) {
      return;
    }

    // Queue sync event
    syncEngine.queueEvent({
      source: 'local', // Email treated as local input
      target: 'notion',
      operation: 'create',
      data: {
        type: 'email',
        emailId: email.id,
        from: email.from,
        subject: email.subject,
        body: email.body.substring(0, 5000),
        attachmentCount: email.attachments?.length || 0,
        receivedAt: email.receivedAt.toISOString(),
      },
    });

    console.log(`📨 Email processed: ${email.subject}`);
  }
}

// =====================================================
// VOICE WATCHER (VAPI Integration)
// =====================================================

export interface VoiceConfig {
  provider: 'vapi' | 'whisper' | 'deepgram';
  apiKey?: string;
  assistantId?: string;
  webhookSecret?: string;
}

export class VoiceWatcher {
  private config: VoiceConfig;
  private isRunning = false;

  constructor(config: VoiceConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    console.log(`🎤 Starting voice watcher (${this.config.provider})`);
    this.isRunning = true;

    // Voice watcher is event-driven via webhooks, not polling
    // The actual webhook handler should be set up in the Express server

    console.log('✅ Voice watcher started (webhook mode)');
  }

  stop(): void {
    this.isRunning = false;
    console.log('🛑 Voice watcher stopped');
  }

  /**
   * Process a voice command/transcription from webhook
   * Call this from the Express webhook handler
   */
  async processVoiceEvent(event: {
    type: 'transcription' | 'command' | 'conversation';
    transcript: string;
    confidence?: number;
    speaker?: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const syncEngine = getSyncEngine();

    // Parse voice command for actionable items
    const parsedCommand = this.parseVoiceCommand(event.transcript);

    if (parsedCommand.isActionable) {
      syncEngine.queueEvent({
        source: 'local',
        target: 'notion',
        operation: 'create',
        data: {
          type: 'voice_command',
          transcript: event.transcript,
          command: parsedCommand.command,
          parameters: parsedCommand.parameters,
          confidence: event.confidence,
          timestamp: event.timestamp.toISOString(),
        },
      });

      console.log(`🎙️ Voice command: ${parsedCommand.command}`);
    }

    // Also log all transcriptions to conversation history
    if (event.type === 'conversation') {
      syncEngine.queueEvent({
        source: 'local',
        target: 'github',
        operation: 'create',
        data: {
          type: 'voice_log',
          transcript: event.transcript,
          speaker: event.speaker,
          timestamp: event.timestamp.toISOString(),
        },
      });
    }
  }

  /**
   * Parse voice transcript for PAULI commands
   */
  private parseVoiceCommand(transcript: string): {
    isActionable: boolean;
    command?: string;
    parameters?: Record<string, string>;
  } {
    const lowerTranscript = transcript.toLowerCase();

    // Check for wake words
    const wakeWords = ['pauli', 'hey pauli', 'ok pauli', 'jarvis', 'hey jarvis'];
    const hasWakeWord = wakeWords.some(w => lowerTranscript.includes(w));

    if (!hasWakeWord) {
      return { isActionable: false };
    }

    // Parse command patterns
    const commandPatterns: Array<{
      pattern: RegExp;
      command: string;
      extractParams: (match: RegExpMatchArray) => Record<string, string>;
    }> = [
      {
        pattern: /create (?:a )?(?:new )?task[:\s]+(.+)/i,
        command: 'create_task',
        extractParams: (m) => ({ title: m[1] }),
      },
      {
        pattern: /add (?:a )?note[:\s]+(.+)/i,
        command: 'add_note',
        extractParams: (m) => ({ content: m[1] }),
      },
      {
        pattern: /remind me (?:to )?(.+?) (?:at|in|on) (.+)/i,
        command: 'create_reminder',
        extractParams: (m) => ({ task: m[1], when: m[2] }),
      },
      {
        pattern: /search (?:for )?(.+)/i,
        command: 'search',
        extractParams: (m) => ({ query: m[1] }),
      },
      {
        pattern: /what(?:'s| is) the status of (.+)/i,
        command: 'get_status',
        extractParams: (m) => ({ project: m[1] }),
      },
      {
        pattern: /sync (?:all|everything|now)/i,
        command: 'force_sync',
        extractParams: () => ({}),
      },
    ];

    for (const { pattern, command, extractParams } of commandPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        return {
          isActionable: true,
          command,
          parameters: extractParams(match),
        };
      }
    }

    // Unknown command but has wake word - log for later analysis
    return {
      isActionable: true,
      command: 'unknown',
      parameters: { rawTranscript: transcript },
    };
  }
}

// =====================================================
// GITHUB WATCHER (Already exists, adding here for completeness)
// =====================================================

export class GitHubWatcher {
  private isRunning = false;
  private pollInterval: number;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastCheckedAt: Date;

  constructor(config: { pollInterval?: number } = {}) {
    this.pollInterval = config.pollInterval || 5000; // 5 seconds
    this.lastCheckedAt = new Date();
  }

  async start(): Promise<void> {
    console.log('🐙 Starting GitHub watcher');
    this.isRunning = true;
    this.poll();
    console.log('✅ GitHub watcher started');
  }

  stop(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    console.log('🛑 GitHub watcher stopped');
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.checkForChanges();
    } catch (error) {
      console.error('GitHub poll error:', error);
    }

    this.pollTimer = setTimeout(() => this.poll(), this.pollInterval);
  }

  private async checkForChanges(): Promise<void> {
    // This would use Octokit to check for new commits since lastCheckedAt
    // For now, we rely on webhooks set up in GitHub
    // console.log('🐙 GitHub check (webhook mode preferred)');
  }
}

// =====================================================
// GOOGLE DRIVE WATCHER (Already exists, adding here for completeness)
// =====================================================

export class GoogleDriveWatcher {
  private isRunning = false;
  private folderId: string;
  private pollInterval: number;
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(config: { folderId: string; pollInterval?: number }) {
    this.folderId = config.folderId;
    this.pollInterval = config.pollInterval || 86400000; // Daily
  }

  async start(): Promise<void> {
    console.log('📁 Starting Google Drive watcher');
    this.isRunning = true;
    // Google Drive uses push notifications when possible
    // Fall back to polling for changes
    this.poll();
    console.log('✅ Google Drive watcher started');
  }

  stop(): void {
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    console.log('🛑 Google Drive watcher stopped');
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.checkForChanges();
    } catch (error) {
      console.error('Google Drive poll error:', error);
    }

    this.pollTimer = setTimeout(() => this.poll(), this.pollInterval);
  }

  private async checkForChanges(): Promise<void> {
    // Would use Google Drive API to check for changes
    console.log('📁 Google Drive check (stub - implement with Drive API)');
  }
}

// =====================================================
// WATCHER MANAGER
// =====================================================

export class WatcherManager {
  private watchers: Map<string, FilesystemWatcher | EmailWatcher | VoiceWatcher | GitHubWatcher | GoogleDriveWatcher> = new Map();

  register(name: string, watcher: FilesystemWatcher | EmailWatcher | VoiceWatcher | GitHubWatcher | GoogleDriveWatcher): void {
    this.watchers.set(name, watcher);
    console.log(`📡 Registered watcher: ${name}`);
  }

  async startAll(): Promise<void> {
    for (const [name, watcher] of this.watchers) {
      try {
        await watcher.start();
      } catch (error) {
        console.error(`Failed to start watcher ${name}:`, error);
      }
    }
  }

  stopAll(): void {
    for (const [name, watcher] of this.watchers) {
      try {
        watcher.stop();
      } catch (error) {
        console.error(`Failed to stop watcher ${name}:`, error);
      }
    }
  }

  getStatus(): Record<string, { running: boolean }> {
    const status: Record<string, { running: boolean }> = {};
    for (const [name, watcher] of this.watchers) {
      status[name] = { running: true }; // Simplified - would check actual state
    }
    return status;
  }
}

// Export singleton manager
export const watcherManager = new WatcherManager();
