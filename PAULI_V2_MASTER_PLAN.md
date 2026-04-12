# PAULI 2.0: OpenClaw Integration Master Plan
## Full-Stack Rust Rewrite with Advanced Memory & Learning

---

## EXECUTIVE SUMMARY

OpenClaw's latest releases introduce **5 game-changing capabilities** that will transform PAULI from a reactive chat agent into a **proactive, learning superintelligence**:

1. **Active Memory Plugin** - Autonomous context retrieval before every response
2. **ChatGPT Export Ingestion** - Immediate knowledge absorption from past conversations
3. **Memory-Wiki System** - Persistent knowledge base with fact tracking
4. **Dreaming Engine** - Scheduled consolidation & pattern discovery
5. **Diary System** - Timeline-based memory navigation & summaries

This plan converts PAULI's backend from TypeScript/Express to **production-grade Rust** with:
- SQLite vector database with FTS5 full-text search
- Hybrid semantic + lexical search (0.7 vector + 0.3 keyword weighting)
- 3-phase dreaming (Light 6h, Deep 3AM, REM Sunday 5AM)
- ChatGPT JSON parsing + risk-aware ingestion
- Multi-provider embedding support (OpenAI, Gemini, Voyage, Mistral, Ollama)
- Encrypted memory storage with privacy controls
- Real-time memory injection into Claude prompt context

---

## FEATURE COMPARISON: PAULI v1 vs v2

### Current PAULI (v1)

```
┌─ Frontend (React + Vite) ───────────┐
│  - Chat interface                   │
│  - Project sidebar                  │
│  - Real-time WebSocket streaming    │
└─────────────────────────────────────┘
         ↓ WebSocket
┌─ Backend (TypeScript/Express) ─────┐
│  - /api/chat → Claude API           │
│  - /ws → Streaming                  │
│  - RTK token optimization           │
│  - MCP GitHub integration           │
│  - Flywheel execution engine        │
│  - Basic conversation history       │
└─────────────────────────────────────┘
         ↓
┌─ Claude 3.5 Sonnet ────────────────┐
│  - Raw responses                    │
│  - No persistent learning           │
│  - No context from past chats       │
└─────────────────────────────────────┘
```

### PAULI v2 (Post-Integration)

```
┌─ Frontend (React + Vite Enhanced) ────────────────────┐
│  ✨ NEW:                                              │
│  - Memory Browser (search + browse)                   │
│  - Imported Insights dashboard                        │
│  - Memory Palace visualization                        │
│  - Diary timeline navigator                           │
│  - ChatGPT import uploader                            │
│  - Memory statistics & health                         │
│  ────────────────────────────────────                 │
│  EXISTING:                                            │
│  - Chat interface                                     │
│  - Project sidebar                                    │
│  - Real-time WebSocket streaming                      │
└─────────────────────────────────────────────────────────┘
                  ↓ WebSocket
┌─ Backend (Production Rust) ───────────────────────────┐
│  ✨ NEW:                                              │
│  - Memory Engine (LanceDB + SQLite)                   │
│  - Hybrid Search (semantic + lexical)                 │
│  - Active Memory Sub-Agent                           │
│  - Dreaming/Consolidation (Light/Deep/REM)           │
│  - ChatGPT Import Pipeline                           │
│  - Diary/Timeline Management                         │
│  - Encryption & Privacy Controls                      │
│  ────────────────────────────────────                 │
│  EXISTING:                                            │
│  - /api/chat → Claude (now with memory)              │
│  - /ws → Streaming                                    │
│  - RTK token optimization                             │
│  - MCP GitHub integration                             │
│  - Flywheel execution engine                          │
│  - Conversation history                               │
└─────────────────────────────────────────────────────────┘
                  ↓
┌─ Memory System (Persistent) ──────────────────────────┐
│  ┌─ Vector Database ─────────────────────────────────┐
│  │ ├─ MEMORY.md (durable facts)                      │
│  │ ├─ memory/YYYY-MM-DD.md (daily notes)             │
│  │ ├─ DREAMS.md (consolidation diary)                │
│  │ ├─ memory/.dreams/ (machine state)                │
│  │ └─ memory-wiki/ (knowledge base)                  │
│  └──────────────────────────────────────────────────┘
│  ┌─ Embedding Storage ───────────────────────────────┐
│  │ ├─ Float32 vectors (1536d or 3072d)              │
│  │ ├─ Full-text search index (FTS5)                  │
│  │ └─ Metadata (timestamps, risk, topics)            │
│  └──────────────────────────────────────────────────┘
│  ┌─ Chat Import Storage ─────────────────────────────┐
│  │ ├─ Imported transcripts                           │
│  │ ├─ Risk flags (health, finance, relationships)    │
│  │ ├─ Topic tags                                     │
│  │ └─ Preference signals                             │
│  └──────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
                  ↓
      ┌─ Claude with Memory Injection ──────┐
      │  ├─ System prompt + current chat    │
      │  ├─ Active memory (top 5 relevant)  │
      │  ├─ Recent daily notes               │
      │  ├─ Dream insights & patterns        │
      │  ├─ Preference signals               │
      │  └─ Dream diary (optional reference)|
      └──────────────────────────────────────┘
                  ↓
    📈 Enhanced responses with
    full context of user's:
    - Past decisions & preferences
    - Relevant facts & knowledge
    - Discovered patterns & insights
    - Personal goals & values
```

---

## DETAILED FEATURE BREAKDOWN

### 1. ACTIVE MEMORY PLUGIN ⚡

**What it does**: Before Claude responds to ANY question, automatically finds and injects the 5 most relevant past memories.

**Current PAULI missing**: No context lookup; starts fresh each conversation

**Integration approach**:
```rust
// Pseudo-pseudocode architecture
BeforeClaudeResponds {
    // 1. Analyze user's new message
    query = extract_intent(user_message)
    
    // 2. Search memory system
    memories = hybrid_search(
        query,
        limit: 5,
        vector_weight: 0.7,
        keyword_weight: 0.3,
        temporal_decay: true
    )
    
    // 3. Format for injection
    context = format_memory_section(memories)
    
    // 4. Inject into system prompt
    enhanced_system = format!(
        "{}\n\nRELEVANT_MEMORIES:\n{}",
        original_system,
        context
    )
    
    // 5. Send to Claude with enhanced context
    response = claude.messages.create(
        system: enhanced_system,
        messages: conversation_history
    )
}
```

**Benefits**:
- User doesn't have to repeat themselves
- PAULI references past decisions
- Consistency in advice and recommendations
- Remembers user preferences automatically

**Metrics**:
- Search latency: <100ms (SLA)
- Relevance accuracy: 85%+
- Memory injection: 99.9% uptime

---

### 2. CHATGPT EXPORT IMPORT 📥

**What it does**: User uploads ChatGPT JSON exports; PAULI instantly absorbs all that knowledge.

**Current PAULI missing**: No way to ingest past conversations from other tools

**Integration approach**:
```rust
ImportChatGPTExports {
    // 1. Parse JSON structure
    exports = parse_chatgpt_json(uploaded_file)
    
    // 2. Extract active branches
    conversations = extract_active_branches(exports)
        // Follows parent→child node traversal
        // Reconstructs conversation threads
    
    // 3. Risk assessment
    for conv in conversations {
        risk_level = assess_risk(conv)  // finance, health, relationships, etc.
        conv.withheld = risk_level > THRESHOLD
    }
    
    // 4. Topic extraction
    topics = extract_topics(conv)  // travel, cooking, finance, etc.
    
    // 5. Preference signal detection
    preferences = extract_preferences(conv)
    // Keywords: "prefer", "love", "hate", "want", "avoid"
    
    // 6. Generate markdown pages
    for conv in conversations {
        page = ConversationPage {
            title: conv.title,
            source: "chatgpt-export",
            risk_flags: conv.risk,
            topics: topics,
            preferences: preferences,
            transcript: conv.markdown,
            import_date: now(),
            original_ids: conv.ids,
        }
        
        // 7. Store in memory system
        store_memory_page(page)
        generate_embeddings(page.transcript)
        index_fts5(page)
    }
    
    // 8. Generate import summary
    summary = ImportSummary {
        conversations_imported: len(conversations),
        total_messages: sum(len(c.messages) for c in conversations),
        topics_discovered: unique_topics,
        preferences_learned: preferences,
        risk_flags_created: risk_warnings,
    }
    
    notify_user(summary)
}
```

**Data mapping**:
```
ChatGPT JSON Structure           →  PAULI Memory Structure
├─ conversations[]              →  memory/YYYY-MM-DD.md entries
│  ├─ id                        →  imported_chat_id
│  ├─ title                     →  Page title
│  ├─ mapping {node}            →  Transcript reconstruction
│  │  ├─ id                     →  Message UUID
│  │  ├─ parent                 →  Parent relationship (traversal)
│  │  ├─ children[]             →  Child relationships
│  │  └─ message                →  Actual content
│  │      ├─ content.parts[]    →  Message text (joined)
│  │      ├─ author.role        →  "user" or "assistant"
│  │      └─ create_time        →  Timestamp
│  └─ current_node              →  Active branch head
└─ timestamp                    →  Import timestamp
```

**Risk Categorization**:
- `health`: Medical, mental health, body image, nutrition
- `relationships`: Dating, family, personal conflicts
- `finance`: Investments, debts, income, budgeting
- `legal`: Contracts, compliance, liability
- `drugs`: Substance use, medications

**Benefits**:
- Instant knowledge absorption
- Consistent personality (learns from past interactions)
- Preference-aware recommendations
- Zero data loss from other platforms

**Metrics**:
- Import speed: 1000 messages/second
- Accuracy: 98%+ chat reconstruction
- Risk detection: 95%+ coverage
- Deduplication: <5% false positives

---

### 3. MEMORY-WIKI KNOWLEDGE BASE 📚

**What it does**: Organizes imported knowledge into an interconnected wiki with facts, entities, and synthesis pages.

**Current PAULI missing**: No structured knowledge organization

**File Structure**:
```
memory-wiki/
├─ entities/          # People, organizations, products
│  ├─ alice.md
│  ├─ project-x.md
│  └─ ...
├─ concepts/          # Ideas, practices, technologies
│  ├─ machine-learning.md
│  ├─ productivity-system.md
│  └─ ...
├─ syntheses/         # Conclusions, principles, patterns
│  ├─ decision-framework.md
│  ├─ personal-values.md
│  └─ ...
├─ sources/           # Reference materials, articles
│  ├─ chatgpt-export-2024.md
│  ├─ blog-post-3.md
│  └─ ...
├─ reports/           # Analysis, reviews, assessments
│  ├─ 2024-reflection.md
│  ├─ project-retrospective.md
│  └─ ...
└─ .openclaw-wiki/
   └─ cache/          # Machine-generated digests
```

**Page Structure** (Markdown with frontmatter):
```yaml
---
title: Alice (friend)
type: entity
source: chatgpt-export
created: 2024-01-15
updated: 2024-04-12
tags: [friendship, college, memories]
risk: low
claims: 3
evidence: 5
contradictions: 0
---

## Summary
Alice is my college roommate who...

## Facts
- Lives in Seattle (claim: from her message 2024-01-20)
- Works as a software engineer (source: personal conversation)
- Likes hiking (evidence: mentioned 3 times)

## Related
- [[Project-X]] - we worked together on this
- [[Decision-Framework]] - influenced my thinking

## Contradictions
None known.
```

**Wiki Tools Available**:
```
wiki_status()        # Health check: pages, claims, contradictions
wiki_lint()          # Find orphaned pages, broken links
wiki_search(query)   # Find pages by content
wiki_get(path)       # Retrieve full page content
wiki_apply(edit)     # Add claims, resolve contradictions
```

**Benefits**:
- Obsidian-compatible (human can edit offline)
- Claim/evidence tracking (verifiable knowledge)
- Contradiction detection (catch inconsistencies)
- Deterministic structure (machine-reproducible)

---

### 4. DREAMING ENGINE 💭

**What it does**: Runs 3 types of background consolidation (Light/Deep/REM) to extract patterns and synthesize knowledge.

**Current PAULI missing**: No automated learning or pattern discovery

**Three Phases**:

#### Phase 1: Light Dreaming (Every 6 hours)
```rust
LightDreaming {
    // Fast, high-deduplication consolidation
    
    config = LightDreamConfig {
        dedup_threshold: 0.9,  // High - merge similar items
        lookback_days: 2,
        max_items: 100,
    }
    
    candidates = gather_signals([
        daily_interactions,
        session_records,
        recall_events,
    ])
    
    items = dedup_and_filter(candidates, config)
    
    for item in items {
        append_to_memory(MEMORY.md, item)
    }
}
```

#### Phase 2: Deep Dreaming (3 AM nightly)
```rust
DeepDreaming {
    // Balanced, quality-focused consolidation
    
    config = DeepDreamConfig {
        min_score: 0.8,
        min_recalls: 3,           // Mentioned at least 3 times
        min_unique_queries: 3,    // Asked about in 3 different ways
        lookback_days: 14,
        recency_halflife_days: 30,
    }
    
    // 6-factor scoring model:
    // frequency (0.24) - mentioned often
    // relevance (0.30) - important to user
    // query_diversity (0.15) - discussed in different contexts
    // recency (0.15) - recent interaction
    // consolidation (0.10) - builds on existing knowledge
    // richness (0.06) - complex/detailed
    
    score(item) = (
        0.24 * normalized(frequency) +
        0.30 * normalized(relevance) +
        0.15 * normalized(query_diversity) +
        0.15 * normalized(recency) +
        0.10 * normalized(consolidation) +
        0.06 * normalized(richness)
    )
    
    if health_score < 0.35 {
        skip_dreaming()  // Rest if unhealthy
    }
    
    candidates = gather_signals([
        daily_interactions,
        session_records,
        recall_events,
    ])
    
    qualified = filter(candidates, min_score: 0.8)
    items = rank_and_select(qualified, top_100)
    
    for item in items {
        append_to_memory(MEMORY.md, item)
        append_to_dreams(DREAMS.md, item)
    }
}
```

#### Phase 3: REM Dreaming (Sunday 5 AM)
```rust
REMDreaming {
    // Expensive pattern recognition
    
    config = REMDreamConfig {
        min_strength: 0.75,
        lookback_days: 7,
        candidates_count: 10,
    }
    
    // Find meta-patterns across memories
    // E.g.: "User often changes mind about X"
    //        "Decisions cluster around Y"
    //        "Pattern: tends to procrastinate on Z"
    
    patterns = find_meta_patterns(
        memory_set,
        config
    )
    
    for pattern in patterns {
        insight = synthesize_insight(pattern)
        append_to_memory(MEMORY.md, insight)
    }
    
    update_dream_diary(patterns)
}
```

**Dreaming Controls** (configurable):
```rust
DreamingConfig {
    enabled: true,
    light_dreams: {
        enabled: true,
        interval_hours: 6,
        speed: DreamSpeed::Fast,
        thinking_budget: Low,
        compute_budget: Cheap,
    },
    deep_dreams: {
        enabled: true,
        time_of_day: "03:00",
        speed: DreamSpeed::Balanced,
        thinking_budget: Medium,
        compute_budget: Medium,
    },
    rem_dreams: {
        enabled: true,
        day_of_week: Sunday,
        time_of_day: "05:00",
        speed: DreamSpeed::Slow,
        thinking_budget: High,
        compute_budget: Expensive,
    },
}
```

**Dream Diary Output** (DREAMS.md):
```markdown
# Dream Diary

## 2026-04-12 Deep Dream (3:16 AM)
- Discovered pattern: You often ask about project management after 8 PM
  - Hypothesis: Evening reflection time
  - Recommendation: Schedule planning sessions then
  
- Consolidated: "Alice prefers async communication"
  - Evidence: Mentioned 4 times across different exports
  - Confidence: High

- New insight: "You value work-life balance"
  - From synthesis of: vacation preferences, schedule comments, goals
  - Pattern strength: 0.87

---

## 2026-04-10 REM Dream (5:02 AM)
**Meta-Pattern: Decision-Making Style**
- You typically gather info, sleep on it, then decide (78% of cases)
- When you rush decisions, you regret them 2 weeks later
- Recommendation: Add 24-hour buffer to major decisions

---
```

**Benefits**:
- Automatic pattern discovery
- Converts sparse signals into insights
- Improves recommendations over time
- Helps identify blind spots & biases

**Metrics**:
- Pattern accuracy: 90%+
- Insight relevance: 85%+
- Processing time: <30 minutes per phase

---

### 5. DIARY & TIMELINE SYSTEM 📅

**What it does**: Organizes memories chronologically with search, filtering, and narrative summaries.

**Current PAULI missing**: No temporal organization or narrative browsing

**Features**:
```rust
DiarySystem {
    // Timeline navigation
    view_date(date) → shows memories from that day
    view_week(date) → summary + key events
    view_month(date) → monthly synthesis
    view_year(date) → yearly reflection
    
    // Backfill controls
    backfill_missing_period(start, end) → retrospective fill
    reset_to_snapshot(date) → restore previous state
    
    // Tracing
    trace_decision(id) → shows reasoning path
    trace_pattern(id) → shows supporting evidence
    
    // Scene lane (staged workflows)
    create_scene(name) → staging area for edits
    promote_scene(scene) → integrate into main timeline
    preview_promotion(scene) → see impact
}
```

**Timeline Views**:

```
YEAR VIEW (2024)
├─ Q1 (Jan-Mar): Learning phase
│  ├─ Major events: Started Python, read "Deep Work"
│  ├─ Decisions: Changed workout routine, new job interview
│  └─ Insights: "I learn best by doing"
│
├─ Q2 (Apr-Jun): Execution phase
│  ├─ Major events: Accepted job offer, completed project X
│  ├─ Decisions: Moved to Seattle, hired personal trainer
│  └─ Insights: "Support systems matter more than willpower"
│
├─ Q3 (Jul-Sep): Consolidation phase
└─ Q4 (Oct-Dec): Reflection & planning


MONTH VIEW (April 2024)
├─ 2024-04-01: Onboarded at new job
│  ├─ Memories: 12 stored
│  ├─ Dreams: 2 insights created
│  ├─ Topics: [work, decisions, learning]
│  └─ Sentiment: Excited → Overwhelmed
│
├─ 2024-04-15: First presentation
│  ├─ Memories: 8 stored
│  ├─ Topics: [public-speaking, confidence]
│  └─ Outcome: "More confident than expected"
│
└─ 2024-04-30: Monthly review
   ├─ Key learnings: 5
   ├─ Decisions made: 3
   └─ Patterns identified: 2


DAY VIEW (2024-04-12)
├─ 09:00 - Morning standup
│  └─ Memory: "Team dynamic is good, need better documentation"
│
├─ 14:30 - Code review feedback
│  └─ Memory: "My approach to testing was too conservative"
│  └─ Dream insight: "Relates to risk-aversion pattern"
│
├─ 18:00 - Evening reflection
│  └─ Manual entry: "Realized I procrastinate on documentation"
│  └─ Connected to: 3 past memories, 1 pattern
│
└─ Summary
   ├─ Memories added: 5
   ├─ Connections made: 8
   └─ Sentiment trend: ↑ (improving)
```

**Benefits**:
- Narrative sense of personal history
- See patterns emerge over time
- Find "catalyst events" that changed thinking
- Review decisions with full context

---

## SYSTEM ARCHITECTURE: PAULI v2 RUST BACKEND

```
┌─────────────────────────────────────────────────────────────┐
│          React Frontend (TypeScript + Vite)                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Chat | Memory Browser | Diary | Import | Dashboard │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │ WebSocket/REST
┌──────────────────────┴──────────────────────────────────────┐
│              Rust Async Runtime (Tokio)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        HTTP Server (Axum) & WebSocket Handler       │    │
│  └─────────────────────────────────────────────────────┘    │
└──┬──────────────────────────────────────────────────────┬───┘
   │                                                      │
┌──┴──────────────────────────────┐  ┌──────────────────┴────┐
│   Chat & Agent Orchestrator      │  │  Memory & Storage Mgr │
├──────────────────────────────────┤  ├──────────────────────┤
│ ✓ /api/chat handler              │  │ ✓ Memory engine      │
│ ✓ RTK token optimization         │  │ ✓ Vector search      │
│ ✓ MCP GitHub integration         │  │ ✓ FTS5 indexing     │
│ ✓ Flywheel execution             │  │ ✓ Embedding API      │
│ ✓ Claude API client              │  │ ✓ ChatGPT import     │
│ ✓ WebSocket streaming            │  │ ✓ Wiki management    │
└──────────┬───────────────────────┘  └────────────┬─────────┘
           │                                      │
    ┌──────┴──────────┐                ┌─────────┴────────┐
    │ Claude API 3.5  │                │ LanceDB/SQLite   │
    │ (with memory    │                │ ┌──────────────┐ │
    │  injection)     │                │ │ Vectors      │ │
    │                 │                │ │ FTS5 Index   │ │
    │ Request:        │                │ │ Metadata     │ │
    │ ┌─────────────┐ │                │ │ Memories     │ │
    │ │System+Mem   │ │                │ │ Diary        │ │
    │ │History      │ │                │ │ Wiki         │ │
    │ │Recent notes │ │                │ └──────────────┘ │
    │ │Dreams       │ │                └──────────────────┘
    │ └─────────────┘ │
    └─────────────────┘                         │
                                     ┌──────────┴──────────────┐
                                     │  Background Tasks      │
                                     ├───────────────────────┤
                                     │ ✓ Light dreaming (6h) │
                                     │ ✓ Deep dreaming (3AM) │
                                     │ ✓ REM dreaming (Sun)  │
                                     │ ✓ Memory consolidation│
                                     │ ✓ Embedding updates   │
                                     │ ✓ Health checks       │
                                     └───────────────────────┘
```

---

## RUST CRATES SELECTION

### Core Framework
- **tokio** - Async runtime
- **axum** - HTTP server & routing
- **serde** / **serde_json** - JSON parsing & serialization

### Database & Search
- **sqlx** - Async SQL client
- **rusqlite** - SQLite bindings  
- **sqlite-vec** - Vector search (cosine similarity)
- **tantivy** - Full-text search (BM25 scoring)
- **lancedb** - Modern vector DB option
- **uuid** - Unique identifiers

### Embeddings & ML
- **openai-api** - OpenAI embedding API
- **reqwest** - HTTP client
- **ndarray** - Numerical arrays for vector math
- **ndarray-linalg** - Linear algebra (for cosine distance)

### Cryptography & Security
- **sha2** / **blake3** - Hashing
- **aes-gcm** - Encryption for sensitive data
- **argon2** - Password hashing (if user auth added)
- **zeroize** - Secure memory clearing

### Utilities
- **chrono** - Date/time handling
- **regex** - Pattern matching
- **log** / **tracing** - Structured logging
- **clap** - CLI argument parsing
- **thiserror** - Error handling
- **async-trait** - Async trait support

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- [ ] Set up Rust project with Tokio/Axum
- [ ] SQLite schema for memories
- [ ] Vector storage (Float32 serialization)
- [ ] FTS5 indexing setup

### Phase 2: Core Memory Engine (Week 2)
- [ ] Memory store/recall operations
- [ ] Hybrid search (vector + keyword)
- [ ] Embedding provider clients
- [ ] Memory ranking algorithms

### Phase 3: ChatGPT Import (Week 3)
- [ ] JSON parser for ChatGPT exports
- [ ] Risk assessment pipeline
- [ ] Topic extraction
- [ ] Markdown generation

### Phase 4: Dreaming System (Week 4)
- [ ] Scoring algorithms (6-factor model)
- [ ] Light/Deep/REM scheduling
- [ ] Consolidation & pattern discovery
- [ ] Dream diary generation

### Phase 5: Integration (Week 5)
- [ ] Memory injection into Claude prompts
- [ ] WebSocket memory retrieval
- [ ] REST API endpoints
- [ ] Active memory sub-agent

### Phase 6: Frontend & Dashboard (Week 6)
- [ ] Memory Browser UI
- [ ] Diary Timeline component
- [ ] Import uploader
- [ ] Dashboard statistics

### Phase 7: Hardening (Week 7)
- [ ] Encryption layer
- [ ] Privacy controls
- [ ] Performance optimization
- [ ] Error recovery

---

## EXPECTED PERFORMANCE

| Metric | Target | Method |
|--------|--------|--------|
| Memory search latency | <100ms | Vector similarity + in-memory caching |
| ChatGPT import speed | 1000 msg/sec | Batch processing + parallel parsing |
| Active memory injection | 99.9% success | Retry logic + fallback graceful degradation |
| Embedding generation | <5ms per item | Batch API calls + caching |
| Dream consolidation | <30 min | Scheduled background task |
| Memory deduplication | <5% false positives | Similarity thresholding |
| Search recall accuracy | 95%+ | Hybrid model + human feedback |
| Cold start (no memory) | <200ms | Lazy loading + connection pooling |

---

## SECURITY & PRIVACY

**Encryption**:
- Sensitive memories encrypted with AES-256-GCM
- User-provided encryption key (optional)
- At-rest encryption for database

**Privacy Controls**:
- Ability to mark memories as "private" (not injected)
- Risk-based filtering (health/finance/relationships)
- GDPR-style "right to be forgotten"
- Audit logging of memory access

**Data Integrity**:
- Versioning & rollback capability
- Contradiction detection in wiki
- Tamper detection (hash verification)

---

## SUCCESS METRICS

After implementation, PAULI v2 should achieve:

1. **User Retention**: 90%+ monthly active users
2. **Memory Accuracy**: 95%+ relevant search results
3. **Pattern Discovery**: 3+ actionable insights per week
4. **Response Quality**: 40% improvement in personalization
5. **Performance**: <200ms end-to-end latency
6. **Reliability**: 99.95% uptime (all services)
7. **Privacy**: 100% user data under user control

---

## NEXT STEPS

1. **Confirm priorities**: Which features ship first?
2. **Review architecture**: Any concerns or questions?
3. **Establish timeline**: How aggressive should we be?
4. **Set up Rust project**: Monorepo structure?
5. **Begin Phase 1**: Foundation setup

---

**Document Version**: 1.0
**Last Updated**: 2026-04-12
**Status**: Ready for implementation planning
