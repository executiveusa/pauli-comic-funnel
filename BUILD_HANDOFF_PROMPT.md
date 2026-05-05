# 🚀 CODEX BUILD HANDOFF - PAULI EFFECT PRODUCTION LAUNCH

**Status:** READY FOR FULL IMPLEMENTATION  
**Specification:** IMPLEMENTATION_SPEC.json  
**Testing:** Spec-Driven, Test-Driven Development (TDD)  
**Verification:** Self-checking loops with checklist validation  

---

## 📋 YOUR MISSION

You are to **BUILD PAULI EFFECT FROM INCOMPLETE STATE TO PRODUCTION-READY** in a single coherent implementation.

**This is not exploratory. This is SURGICAL.**

Every line of code you write must:
1. ✅ Match the spec in IMPLEMENTATION_SPEC.json
2. ✅ Include tests BEFORE you code (TDD)
3. ✅ Self-verify against checklist
4. ✅ Only move to next item when current item is DONE

---

## 🎯 PHASES & CHECKPOINTS

### **PHASE 1: FOUNDATION (Days 1-2)**

**OBJECTIVE:** Database + APIs + Hermes Integration  
**SUCCESS:** Can add/edit/delete contacts via web + mobile, all tests pass  

#### Step 1A: Initialize NPM Dependencies
```
ACTION: Run npm install
VERIFY: All packages install, no errors
TEST: npm list | grep "react@18" should show one instance
CHECKLIST_ITEM: "dependencies_installed"
NEXT: Proceed only if npm list shows clean tree
```

#### Step 1B: Initialize Supabase
```
ACTION: 
  - Create Supabase project (or use self-hosted instance)
  - Create .env with SUPABASE_URL and SUPABASE_KEY
  - Test connection with: npx supabase status

VERIFY: Connection successful, can query empty database
TEST: Create test table, insert row, query it
CHECKLIST_ITEM: "supabase_initialized"
NEXT: Proceed only if connection works
```

#### Step 1C: Apply Prisma Schema
```
ACTION:
  1. Run: npx prisma migrate dev --name init
  2. Run: npx prisma generate
  3. Inspect: prisma/schema.prisma has all 11 models
  
VERIFY: All tables exist in Supabase
TEST:
  - List tables: SELECT tablename FROM pg_tables WHERE schemaname='public'
  - Count rows: SELECT COUNT(*) FROM public.contacts (should be 0)
  
CHECKLIST_ITEM: "database_schema_applied"
NEXT: Proceed only if all tables created
```

#### Step 1D: Create Hermes CRUD API Endpoints
```
ACTION: Create server/routes/hermes.ts
CONTENT:
  - GET /api/hermes (list all contacts)
  - GET /api/hermes/:id (get one)
  - POST /api/hermes (create)
  - PUT /api/hermes/:id (update)
  - DELETE /api/hermes/:id (delete)
  - GET /api/hermes/search?q=:query (search)
  - POST /api/hermes/fuzzy-recall (fuzzy match)

SPEC_REFERENCE: See IMPLEMENTATION_SPEC.json -> api_endpoints.hermes

VALIDATION:
  - All endpoints use Zod validation
  - All responses match spec types
  - All errors return proper HTTP codes
  - Logging on all operations

TESTS: Create server/routes/hermes.test.ts
  - Test list returns array
  - Test create stores in database
  - Test update modifies existing
  - Test delete removes from database
  - Test search returns matches
  - Test fuzzy-recall returns similar contacts
  - Test validation rejects invalid input
  - Minimum 10 test cases, 100% endpoint coverage

RUN: npm run test -- hermes.test.ts
VERIFY: All 10+ tests pass
CHECKLIST_ITEM: "hermes_api_endpoints"
NEXT: Proceed only if all tests pass
```

#### Step 1E: Create Tasks CRUD API Endpoints
```
ACTION: Create server/routes/tasks.ts
CONTENT: Same pattern as Hermes
  - GET /api/tasks (list)
  - GET /api/tasks/:id
  - POST /api/tasks
  - PUT /api/tasks/:id
  - DELETE /api/tasks/:id

TESTS: Create server/routes/tasks.test.ts
  - Minimum 8 test cases

RUN: npm run test -- tasks.test.ts
VERIFY: All tests pass
CHECKLIST_ITEM: "tasks_api_endpoints"
```

#### Step 1F: Create Workflows CRUD + Execute API
```
ACTION: Create server/routes/workflows.ts
CONTENT:
  - GET /api/workflows (list)
  - POST /api/workflows (create)
  - POST /api/workflows/:id/execute (execute)
  - GET /api/workflows/:id/status (get status)

TESTS: Create server/routes/workflows.test.ts
  - Create workflow, execute it, check status returns

VERIFY: Tests pass
CHECKLIST_ITEM: "workflows_api_endpoints"
```

#### Step 1G: Register All Routes in server/index.ts
```
ACTION:
  1. Import hermes, tasks, workflows routes
  2. Register: app.route('/api/hermes', hermesRoutes)
  3. Register: app.route('/api/tasks', tasksRoutes)
  4. Register: app.route('/api/workflows', workflowRoutes)
  5. Add: app.get('/api/health', (c) => c.json({ status: 'ok' }))

TEST: 
  - npm run server
  - curl http://localhost:3001/api/health
  - Should return { status: 'ok' }

VERIFY: Server starts without errors
CHECKLIST_ITEM: "api_routes_registered"
NEXT: Proceed only if server starts
```

#### Step 1H: Create Frontend API Client Library
```
ACTION: Create src/lib/api.ts
CONTENT: Export functions for all API calls
  
  export const api = {
    hermes: {
      list: async () => fetch('/api/hermes').then(r => r.json()),
      get: async (id) => fetch(`/api/hermes/${id}`).then(r => r.json()),
      create: async (data) => fetch('/api/hermes', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }).then(r => r.json()),
      update: async (id, data) => fetch(`/api/hermes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }).then(r => r.json()),
      delete: async (id) => fetch(`/api/hermes/${id}`, {
        method: 'DELETE'
      }).then(r => r.json()),
      search: async (query) => fetch(`/api/hermes/search?q=${query}`).then(r => r.json()),
      fuzzyRecall: async (query) => fetch('/api/hermes/fuzzy-recall', {
        method: 'POST',
        body: JSON.stringify({ query })
      }).then(r => r.json()),
    },
    tasks: { /* same pattern */ },
    workflows: { /* same pattern */ }
  }

TESTS: Create src/lib/api.test.ts
  - Mock fetch
  - Test api.hermes.list() returns data
  - Test api.hermes.create() sends POST
  - Test error handling

VERIFY: Tests pass
CHECKLIST_ITEM: "api_client_library"
```

#### Step 1I: Wire Hermes Component to Backend
```
ACTION: Modify src/components/HermesRolodex.tsx
CHANGES:
  1. Import api client: import { api } from '@/lib/api'
  2. Add useEffect to load contacts on mount
  3. Change handleAddPerson to call api.hermes.create()
  4. Change setPeople to persist to database
  5. Add handleDelete to call api.hermes.delete()
  6. Add loading states during API calls
  7. Add error handling with toast notifications

SPECIFIC_LINES:
  - Line ~80: Replace SEED_PEOPLE initialization with useEffect that loads from API
  - Line ~150: Update handleAddPerson to call api.hermes.create()
  - Line ~200: Add delete handler that calls api.hermes.delete()

TESTS: Create src/components/HermesRolodex.test.tsx
  - Mock api calls
  - Test contacts load on mount
  - Test can add contact
  - Test can delete contact
  - Test loading/error states

VERIFY: Component tests pass
CHECKLIST_ITEM: "hermes_wired_to_backend"
NEXT: Proceed only after verified
```

#### Step 1J: Add Hermes Route to App Router
```
ACTION: Edit src/App.tsx
CHANGE:
  1. Import HermesRolodex: import HermesRolodex from "@/components/HermesRolodex"
  2. Add route:
     <Route path="/contacts" element={<HermesRolodex />} />

TEST:
  - npm run dev
  - Navigate to http://localhost:5173/contacts
  - Should see Hermes UI
  - Should be able to click "Add"

CHECKLIST_ITEM: "hermes_in_router"
```

#### Step 1K: Update MainNav to Link to Contacts
```
ACTION: Edit src/components/MainNav.tsx
ADD_LINK:
  <Link to="/contacts" className="nav-link">
    📇 Contacts
  </Link>

VERIFY: Link appears in nav, navigates to /contacts
CHECKLIST_ITEM: "nav_updated"
```

#### Step 1L: Mobile Responsive Design
```
ACTION: Update HermesRolodex.tsx CSS (in STYLES constant)
ADD_MEDIA_QUERIES:
  @media (max-width: 768px) {
    .hr-header { grid-template-columns: 1fr }
    .hr-search-wrap { max-width: none }
    .hr-header-actions { grid-column: 1 / -1 }
    .hr-people-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)) }
    .hr-body.panel-open { grid-template-columns: 1fr }
    .hr-panel { position: fixed; inset: 0; }
  }

TEST:
  - Open dev tools
  - Set viewport to 320px
  - Verify layout doesn't break
  - Test on real iPhone (landscape + portrait)
  - Verify buttons clickable (min 44px)

CHECKLIST_ITEM: "mobile_responsive"
```

#### Step 1M: Test End-to-End (Phase 1)
```
ACTION: Full integration test
STEPS:
  1. Start server: npm run server
  2. Start frontend: npm run dev
  3. Navigate to /contacts
  4. Add contact: "John Doe" from "Acme Corp"
  5. Verify it appears in list
  6. Edit contact: Change role to "CEO"
  7. Verify update persists (refresh page)
  8. Search for "John"
  9. Delete contact
  10. Verify it's gone

CHECKLIST_ITEMS_TO_MARK:
  - "phase_1_end_to_end_test"

NEXT: Proceed to Phase 2 only if all above pass
```

---

### **PHASE 2: CORE FEATURES (Days 3-4)**

**OBJECTIVE:** Vector Search + Workflows + File Upload  
**SUCCESS:** Can upload documents, search semantically, create and execute workflows  

#### Step 2A: Setup Vector Database (pgvector)
```
ACTION:
  1. Run: npm install @supabase/supabase-js
  2. Create Prisma model for embeddings
  3. Create migration for pgvector extension
  4. Test vector operations

SPECIFIC:
  - Add to prisma/schema.prisma:
    model Embedding {
      id String @id @default(cuid())
      content String
      embedding Unsupported("vector(1536)")
      metadata Json?
      createdAt DateTime @default(now())
    }

  - Run: npx prisma migrate dev --name add_pgvector
  
TEST:
  - Can insert embedding
  - Can query with similarity search
  
CHECKLIST_ITEM: "pgvector_setup"
```

#### Step 2B: Create Embeddings API Endpoints
```
ACTION: Create server/routes/embeddings.ts
ENDPOINTS:
  - POST /api/embeddings/create
    Body: { text, metadata }
    Action: Create embedding via OpenAI, store in DB
    
  - POST /api/embeddings/search
    Body: { query, limit, threshold }
    Action: Embed query, search similar, return results
    
  - DELETE /api/embeddings/:id

SPEC_REFERENCE: IMPLEMENTATION_SPEC.json -> api_endpoints.embeddings

IMPLEMENTATION:
  - Use OpenAI text-embedding-3-small for embeddings
  - Use pgvector similarity search: <=> operator
  - Return results with similarity score

TESTS: embeddings.test.ts
  - Create embedding
  - Search similar documents
  - Filter by threshold
  - Delete embedding

VERIFY: Tests pass, search returns relevant results
CHECKLIST_ITEM: "embeddings_api"
```

#### Step 2C: Create File Upload Pipeline
```
ACTION: Enhance server/routes/upload.ts
CURRENT_STATE: Basic file upload handler
NEW_STATE:
  1. Receive file
  2. Parse content (PDF/TXT/MD)
  3. Chunk into sentences/paragraphs
  4. Create embeddings for each chunk
  5. Store in vector DB with metadata
  6. Return success with chunk count

IMPLEMENTATION:
  - Use pdf-parse for PDFs
  - Use simple text splitting for TXT/MD
  - Batch create embeddings
  - Handle errors gracefully

TESTS: upload.test.ts
  - Upload PDF
  - Upload TXT
  - Verify chunks created
  - Verify embeddings stored
  - Verify metadata includes filename, page number

VERIFY: Can upload file and search its content
CHECKLIST_ITEM: "file_upload_pipeline"
```

#### Step 2D: Create Workflows Execution Engine
```
ACTION: Create server/services/workflow-engine.ts
CONTENT:
  - Workflow execution logic
  - Task dispatch to queue
  - Status tracking
  - Error handling and retries

IMPLEMENTATION:
  - Use BullMQ for job queue
  - Each workflow step = one job
  - Sequential or parallel execution based on config
  - Store results in database

TESTS: workflow-engine.test.ts
  - Create simple workflow (2 steps)
  - Execute it
  - Verify each step runs
  - Verify results stored

VERIFY: Workflow executes and completes
CHECKLIST_ITEM: "workflow_engine"
```

#### Step 2E: Create Frontend Task Form
```
ACTION: Create src/components/TaskForm.tsx
CONTENT:
  - Title input
  - Description textarea
  - Priority selector
  - Due date picker
  - Submit button

STYLING: Tailwind, match HermesRolodex design

INTEGRATION:
  - On submit, call api.tasks.create()
  - Reset form on success
  - Show error on failure
  - Show loading state

TESTS: TaskForm.test.tsx
  - Form renders
  - Can fill fields
  - Submit calls API
  - Validation works

VERIFY: Form works end-to-end
CHECKLIST_ITEM: "task_form"
```

#### Step 2F: Create Tasks Page
```
ACTION: Create src/pages/Tasks.tsx
CONTENT:
  - List of all tasks
  - Task form to create new
  - Filter by status/priority
  - Mark complete/delete

INTEGRATION:
  - Load tasks from API on mount
  - Update on action
  - Real-time status

TESTS: Tasks.test.tsx (5+ tests)

VERIFY: All task operations work
CHECKLIST_ITEM: "tasks_page"
```

#### Step 2G: Create Workflows Page
```
ACTION: Create src/pages/Workflows.tsx
CONTENT:
  - List existing workflows
  - Workflow builder (visual)
  - Execution history
  - Status monitor (real-time)

INTEGRATION:
  - Create new workflow
  - Execute workflow
  - Monitor progress
  - View results

TESTS: Workflows.test.tsx (5+ tests)

VERIFY: Can create and execute workflow
CHECKLIST_ITEM: "workflows_page"
```

#### Step 2H: Add Routes to App.tsx
```
ACTION: Add to src/App.tsx
<Route path="/tasks" element={<Tasks />} />
<Route path="/workflows" element={<Workflows />} />
<Route path="/files" element={<FileUpload />} />

VERIFY: Routes work, pages load
CHECKLIST_ITEM: "phase_2_routes"
```

#### Step 2I: Test End-to-End (Phase 2)
```
ACTION: Full feature test
STEPS:
  1. Upload PDF file
  2. Semantic search for content
  3. Create new workflow (2 steps)
  4. Execute workflow
  5. Create new task
  6. Complete task
  7. View execution history

CHECKLIST_ITEM: "phase_2_end_to_end"
```

---

### **PHASE 3: AGENTS + INTEGRATIONS (Days 5-6)**

**OBJECTIVE:** WhatsApp + Voice + PAULI Orchestrator  
**SUCCESS:** Can send message via WhatsApp, receive voice call, PAULI coordinates work  

#### Step 3A: Setup Twilio
```
ACTION:
  1. Create Twilio account
  2. Get account SID, auth token, phone number
  3. Add to .env:
     TWILIO_ACCOUNT_SID=...
     TWILIO_AUTH_TOKEN=...
     TWILIO_PHONE_NUMBER=...

INSTALL: npm install twilio

TEST: npm run test -- twilio-setup.test.ts
  - Can initialize Twilio client
  - Can send test SMS

CHECKLIST_ITEM: "twilio_setup"
```

#### Step 3B: Create WhatsApp Webhook Handler
```
ACTION: Create server/webhooks/whatsapp.ts
CONTENT:
  - Webhook endpoint: POST /api/webhooks/whatsapp
  - Verify Twilio signature
  - Parse incoming message
  - Dispatch to PAULI agent
  - Send response back

IMPLEMENTATION:
  1. Verify request signature (TwilioSignatureValidator)
  2. Extract From, Body, MediaUrl
  3. Store message in database
  4. Queue task: api.agents.dispatch({ agent: 'PAULI', task: body, context: { from } })
  5. Return immediately with HTTP 200
  6. When PAULI completes, send response via twilio.messages.create()

SPEC_REFERENCE: IMPLEMENTATION_SPEC.json -> integrations.messaging[WhatsApp]

TESTS: whatsapp.test.ts
  - Webhook receives message
  - Message stored
  - Task dispatched
  - Response sent

VERIFY: Can send WhatsApp message, receive response within 5s
CHECKLIST_ITEM: "whatsapp_webhook"
```

#### Step 3C: Create Voice Call Handler
```
ACTION: Create server/webhooks/voice.ts
CONTENT:
  - Webhook for incoming/outgoing voice events
  - Transcribe voice using Whisper API
  - Send transcription to PAULI
  - Generate TTS response
  - Play response to caller

IMPLEMENTATION:
  1. Handle incoming call (Twilio Voice)
  2. Record message
  3. On recording complete, transcribe using Whisper
  4. Queue task to PAULI with transcription
  5. When PAULI responds, generate TTS
  6. Play TTS to caller
  7. Store call in database

TESTS: voice.test.ts
  - Webhook handles call
  - Transcription works
  - PAULI processes
  - Response played

VERIFY: Can call phone number, speak, hear response
CHECKLIST_ITEM: "voice_integration"
```

#### Step 3D: Create Command Parser
```
ACTION: Create server/services/command-parser.ts
CONTENT:
  - Parse commands from WhatsApp/Voice
  - Recognized commands: /task, /remember, /search, /status
  - Route to appropriate handler
  - Format response

EXAMPLES:
  "/task Buy milk - urgency high"
    → Create task with priority=high
  
  "/remember I met John at Acme Corp"
    → Create contact from context
  
  "/search competitors in AI space"
    → Semantic search embeddings

TESTS: command-parser.test.ts
  - Parse /task command
  - Parse /remember command
  - Parse /search command
  - Handle invalid syntax

VERIFY: Commands parsed correctly
CHECKLIST_ITEM: "command_parser"
```

#### Step 3E: Initialize PAULI Agent
```
ACTION: Create agents/pauli/orchestrator.py
CONTENT:
  - Read tasks from queue (BullMQ)
  - Dispatch to appropriate agent
  - Coordinate multi-step workflows
  - Store results

IMPLEMENTATION:
  - Connect to Redis queue
  - Listen for tasks
  - Route based on task type
  - Call other agents via API
  - Store results

TESTS: agents/pauli/test_orchestrator.py
  - Task queued
  - Agent picks it up
  - Routes to correct handler
  - Returns result

VERIFY: Agent can receive and complete task
CHECKLIST_ITEM: "pauli_agent"
```

#### Step 3F: Create Hermes Agent (Contact Memory)
```
ACTION: Create agents/hermes/contact_agent.py
CONTENT:
  - When task involves contacts
  - Call Hermes API to add/update
  - Provide context for interactions

INTEGRATION:
  - PAULI calls: api.agents.dispatch({ agent: 'HERMES', task })
  - HERMES calls: /api/hermes/* endpoints
  - Stores interaction context

TESTS: agents/hermes/test_hermes_agent.py

VERIFY: Can handle contact-related tasks
CHECKLIST_ITEM: "hermes_agent"
```

#### Step 3G: Create Agent Dispatch API
```
ACTION: Create server/routes/agents.ts
ENDPOINTS:
  - POST /api/agents/dispatch
    Body: { agent, task, context }
    Action: Queue task to BullMQ
    
  - GET /api/agents/:run_id/status
    Action: Return current status and result

IMPLEMENTATION:
  - Queue job: bullQueue.add(agent, { task, context })
  - Store run ID and initial status
  - Poll for completion
  - Return result

TESTS: agents.test.ts
  - Can dispatch task
  - Can get status
  - Can handle failures

VERIFY: Agent receives and processes task
CHECKLIST_ITEM: "agent_dispatch_api"
```

#### Step 3H: Create Real-Time Status Updates
```
ACTION: Setup Server-Sent Events (SSE) for live updates
FILE: server/routes/events.ts
ENDPOINT:
  - GET /api/events/:type/:id
    Action: Open SSE stream
    Returns: Real-time updates as they happen

INTEGRATION:
  - Frontend: useEffect hook subscribes to events
  - On agent update: emit event to all subscribers
  - Frontend updates UI without polling

TEST: events.test.ts

VERIFY: Frontend shows real-time status
CHECKLIST_ITEM: "sse_events"
```

#### Step 3I: Create Agent Status Dashboard
```
ACTION: Create src/components/AgentStatus.tsx
CONTENT:
  - Show all agent statuses
  - Current running tasks
  - Recent completed tasks
  - Real-time updates via SSE

INTEGRATION:
  - Subscribe to /api/events/agents
  - Update on message
  - Show loading/running/completed states

TESTS: AgentStatus.test.tsx

VERIFY: Shows real-time agent status
CHECKLIST_ITEM: "agent_status_dashboard"
```

#### Step 3J: Test End-to-End (Phase 3)
```
ACTION: Full integration test
STEPS:
  1. Send WhatsApp message: "/task Buy milk"
  2. Verify task created in /tasks
  3. Call phone number
  4. Speak: "Remember I met Jane at TechConf"
  5. Verify contact created in /contacts
  6. Send WhatsApp: "/search AI companies"
  7. Verify search results returned
  8. Check agent status dashboard shows all activity

CHECKLIST_ITEM: "phase_3_end_to_end"
```

---

### **PHASE 4: DEPLOYMENT (Days 7)**

#### Step 4A: Setup GitHub Actions CI/CD
```
ACTION: Create .github/workflows/deploy.yml
CONTENT:
  - On push to main:
    1. Run npm install
    2. Run npm run build
    3. Run npm run test
    4. Run npm run lint
    5. Deploy to Vercel (frontend)
    6. Build Docker image (backend)
    7. Deploy to Coolify (backend)

TESTS: 
  - All tests pass
  - Build succeeds
  - Lint passes

VERIFY: CI/CD pipeline works
CHECKLIST_ITEM: "github_actions"
```

#### Step 4B: Docker Configuration
```
ACTION: Create Dockerfile for backend
CONTENT:
  - Node 18 image
  - Install dependencies
  - Build TypeScript
  - Expose port 3001
  - Health check

VERIFY: Docker image builds successfully
CHECKLIST_ITEM: "docker_setup"
```

#### Step 4C: Deploy to Vercel (Frontend)
```
ACTION:
  1. Connect GitHub repo to Vercel
  2. Configure build settings
  3. Add environment variables
  4. Deploy

VERIFY: Frontend accessible at production URL
CHECKLIST_ITEM: "vercel_frontend"
```

#### Step 4D: Deploy to Coolify (Backend)
```
ACTION:
  1. Setup Coolify project
  2. Connect GitHub repository
  3. Configure Docker build
  4. Set environment variables
  5. Deploy

VERIFY: Backend accessible, health check returns 200
CHECKLIST_ITEM: "coolify_backend"
```

#### Step 4E: Setup Monitoring & Logging
```
ACTION:
  - Setup error logging (Sentry or similar)
  - Setup performance monitoring
  - Setup uptime monitoring
  - Create alerts

CHECKLIST_ITEM: "monitoring_setup"
```

#### Step 4F: Final Production Testing
```
ACTION: Full end-to-end on production
STEPS:
  1. Sign up with new email
  2. Add contact
  3. Create task
  4. Send WhatsApp message
  5. Make voice call
  6. Search documents
  7. Execute workflow

VERIFY: All functionality works in production
CHECKLIST_ITEM: "production_testing"
```

---

## ✅ MASTER CHECKLIST

Use this to track progress. Only move to next item when current is DONE.

```
PHASE 1: FOUNDATION
- [ ] dependencies_installed
- [ ] supabase_initialized
- [ ] database_schema_applied
- [ ] hermes_api_endpoints
- [ ] tasks_api_endpoints
- [ ] workflows_api_endpoints
- [ ] api_routes_registered
- [ ] api_client_library
- [ ] hermes_wired_to_backend
- [ ] hermes_in_router
- [ ] nav_updated
- [ ] mobile_responsive
- [ ] phase_1_end_to_end_test

PHASE 2: CORE FEATURES
- [ ] pgvector_setup
- [ ] embeddings_api
- [ ] file_upload_pipeline
- [ ] workflow_engine
- [ ] task_form
- [ ] tasks_page
- [ ] workflows_page
- [ ] phase_2_routes
- [ ] phase_2_end_to_end

PHASE 3: AGENTS + INTEGRATIONS
- [ ] twilio_setup
- [ ] whatsapp_webhook
- [ ] voice_integration
- [ ] command_parser
- [ ] pauli_agent
- [ ] hermes_agent
- [ ] agent_dispatch_api
- [ ] sse_events
- [ ] agent_status_dashboard
- [ ] phase_3_end_to_end

PHASE 4: DEPLOYMENT
- [ ] github_actions
- [ ] docker_setup
- [ ] vercel_frontend
- [ ] coolify_backend
- [ ] monitoring_setup
- [ ] production_testing

FINAL
- [ ] all_tests_passing
- [ ] zero_typescript_errors
- [ ] lighthouse_90+_all_metrics
- [ ] security_scan_zero_critical
- [ ] documentation_complete
```

---

## 🧪 TESTING STRATEGY

### For Every File You Create:

**1. UNIT TESTS (Required)**
```
Location: src/components/Foo.test.tsx or server/routes/foo.test.ts
Coverage: 80%+ of code
Run: npm run test
Success: All tests green ✓
```

**2. INTEGRATION TESTS (Required for APIs)**
```
Location: server/routes/__tests__/foo.integration.test.ts
Coverage: Full endpoint flow
Run: npm run test:integration
Success: API works end-to-end ✓
```

**3. E2E TESTS (Required for flows)**
```
Location: e2e/foo.spec.ts
Framework: Playwright
Coverage: User journey
Run: npm run test:e2e
Success: User can complete flow ✓
```

**4. BEFORE MOVING TO NEXT ITEM:**
```
[ ] Unit tests pass: npm run test
[ ] Integration tests pass: npm run test:integration
[ ] No TypeScript errors: npx tsc --noEmit
[ ] Code formatted: npx prettier --write .
[ ] Linting passes: npm run lint
[ ] E2E test passes (if applicable): npm run test:e2e
```

---

## 🎯 CRITICAL RULES

### DO:
1. ✅ Write tests FIRST (TDD)
2. ✅ Run tests after EVERY commit
3. ✅ Check TypeScript: `npx tsc --noEmit`
4. ✅ Match IMPLEMENTATION_SPEC.json exactly
5. ✅ Add error handling to ALL functions
6. ✅ Validate ALL user input with Zod
7. ✅ Use async/await (no callback hell)
8. ✅ Type everything (no `any`)
9. ✅ Log errors with context
10. ✅ Commit after EACH checklist item

### DONT:
1. ❌ Skip tests
2. ❌ Use hardcoded values (use env vars)
3. ❌ Ignore TypeScript errors
4. ❌ Make blocking database queries
5. ❌ Trust user input (validate everything)
6. ❌ Commit secrets
7. ❌ Deploy without testing
8. ❌ Remove existing functionality
9. ❌ Create long functions (max 50 lines)
10. ❌ Move forward without checklist item complete

---

## 🚨 WHEN TESTS FAIL

**DO NOT PROCEED.** Instead:

1. Read error message carefully
2. Check if it's TypeScript, logic, or async issue
3. Fix root cause (not the test)
4. Re-run test
5. Only mark checklist when green ✓
6. Commit fix before moving on

---

## 📊 SUCCESS METRICS

### Phase 1 Complete When:
- ✅ Can add contact via UI
- ✅ Contact saved to database
- ✅ Contact persists after refresh
- ✅ Can edit/delete contact
- ✅ Works on mobile (320px width)
- ✅ All 13+ tests pass
- ✅ Zero TypeScript errors

### Phase 2 Complete When:
- ✅ Can upload PDF
- ✅ Can search content semantically
- ✅ Can create and execute workflow
- ✅ Can create and complete tasks
- ✅ All 25+ tests pass

### Phase 3 Complete When:
- ✅ Can send WhatsApp message
- ✅ Can receive WhatsApp response within 5s
- ✅ Can call phone number
- ✅ Voice transcription works
- ✅ Agent processes voice command
- ✅ All 30+ tests pass

### Phase 4 Complete When:
- ✅ Frontend deployed on Vercel
- ✅ Backend running on Coolify
- ✅ Database accessible from backend
- ✅ All functionality works in production
- ✅ Monitoring alerts configured
- ✅ Uptime > 99%

---

## 🎬 START HERE

**You are ready to begin. Follow the phases in order.**

1. Read IMPLEMENTATION_SPEC.json completely
2. Start Phase 1, Step 1A
3. Don't proceed until checklist item is DONE
4. Commit after each checklist item
5. Report progress in commit messages
6. Only move to Phase 2 when Phase 1 complete
7. Repeat for all phases

---

**Build with precision. Test everything. Verify before advancing. No shortcuts.**

**You have all the specs. Execute flawlessly.**

🚀
