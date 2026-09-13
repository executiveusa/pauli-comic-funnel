# PAULI - Unified Chat & Project Control

A modern, autonomous chat application that understands your GitHub projects and executes plans with a flywheel learning system.

## Features

### 🧠 Smart Agent System
- **Claude Integration**: Uses Claude 3.5 Sonnet with extended context
- **Token Optimization**: RTK hooks reduce token usage by 60-90%
- **MCP Integration**: Direct access to GitHub repositories and file system
- **Agentic Reasoning**: Multi-turn conversations with tool integration

### 📋 Plan & Execute
- **Manifest-Based Planning**: Create structured execution plans
- **Autonomous Execution**: Idempotent, safe step execution
- **Real-Time Streaming**: WebSocket-powered live response output
- **Error Handling**: Graceful failure recovery with learnings

### 📈 Continuous Learning
- **Flywheel Loop**: Plan → Execute → Learn → Improve
- **Memory System**: Tracks successes, failures, and insights
- **Pattern Recognition**: Identifies optimal action sequences
- **Improvement Suggestions**: Auto-generated optimizations

### 💬 Modern UI
- **React Frontend**: Built with Vite for fast development
- **Real-time Chat**: WebSocket streaming for instant feedback
- **Project Browser**: Sidebar showing all your repositories
- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Eye-friendly interface with accent colors

## Architecture

```
pauli-unified-chat/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx        # Main chat interface
│   │   ├── components/    # ChatWindow, ChatInput
│   │   ├── lib/api.ts     # WebSocket & API client
│   │   └── index.css      # Global styles
│   └── vite.config.ts
├── server/                # Express + Claude backend
│   ├── index.ts           # Express server setup
│   ├── agent/
│   │   └── orchestrator.ts # Agent with Claude integration
│   ├── hooks/
│   │   └── rtk.ts         # Token reduction
│   ├── mcp/
│   │   └── integration.ts # GitHub + filesystem access
│   └── flywheel/
│       └── engine.ts      # Plan execution & learning
├── scripts/
│   └── deploy-skill.js    # Railway deployment automation
└── package.json           # Dependencies & build scripts
```

## Quick Start

### Local Development

1. **Install dependencies**:
```bash
npm install
cd client && npm install && cd ..
```

2. **Set environment variables**:
```bash
export GITHUB_TOKEN=ghp_your_token_here
export ANTHROPIC_API_KEY=sk-ant-your_key_here
```

3. **Start dev server**:
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Local Testing

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

Visit http://localhost:3000 in your browser.

## Deployment

### Railway (Recommended)

1. **Set up Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Set environment variables**:
```bash
export RAILWAY_TOKEN=your_railway_token
export GITHUB_TOKEN=your_github_token
```

3. **Deploy with automation script**:
```bash
npm run deploy:skill
```

This will:
- Install all dependencies
- Build frontend + backend
- Create/update Railway project
- Set environment variables
- Deploy and return live URL

### Manual Railway Deployment

1. Connect your Railway account
2. Create a new project
3. Link this repository
4. Set environment variables in Railway dashboard:
   - `GITHUB_TOKEN`: Your GitHub personal access token
   - `NODE_ENV`: `production`
5. Railway will auto-deploy on push to main

## Usage Guide

### Starting a Chat

1. **Ask about your projects**:
   - "What projects do I have?"
   - "Show me all my repositories"
   - "List my active GitHub projects"

2. **Request analysis**:
   - "What issues are open in my repos?"
   - "Summarize the status of [project-name]"
   - "What needs to be done?"

3. **Create plans**:
   - "Create a plan to fix the auth bug"
   - "Plan the new feature implementation"
   - "Show me the steps to deploy"

4. **Execute plans**:
   - "Execute the plan"
   - "Run the deployment steps"
   - "Start the automation"

### Understanding Responses

- **Streaming responses**: Messages appear in real-time
- **Token savings**: Shows how many tokens were saved
- **Suggestions**: Actionable next steps
- **Error messages**: Clear debugging info with recovery options

## API Endpoints

### REST APIs

- **POST /api/chat** - Send message and get response
  ```javascript
  {
    message: "What projects do I have?",
    userId: "user_123"
  }
  ```

- **GET /api/projects** - List all GitHub projects
  ```javascript
  [
    { name: "project-name", url: "...", status: "active" },
    ...
  ]
  ```

- **POST /api/execute** - Execute a plan manifest
  ```javascript
  { manifestId: "manifest_xyz" }
  ```

- **GET /api/health** - Health check
  ```javascript
  { status: "ok", timestamp: "2026-04-12T..." }
  ```

### WebSocket

- **URL**: `ws://localhost:3000/ws?userId=user_123`
- **Send**: `{ type: "message", content: "Your message" }`
- **Receive**: 
  - `{ type: "chunk", content: "streaming text" }`
  - `{ type: "complete" }`
  - `{ type: "error", content: "error message" }`

## Configuration

### Environment Variables

**Required for GitHub access**:
```
GITHUB_TOKEN=ghp_your_personal_access_token
```

**Required for Claude API**:
```
ANTHROPIC_API_KEY=sk-ant-your_key
```

**Optional for deployment**:
```
PORT=3000                    # Server port
NODE_ENV=production          # Environment
RAILWAY_TOKEN=your_token     # Railway CLI auth
```

### Customization

**Model selection** (in `server/agent/orchestrator.ts`):
```typescript
model: 'claude-3-5-sonnet-20241022'  // Change to claude-opus-4-6, etc
```

**Token optimization** (in `server/hooks/rtk.ts`):
- Adjust the token reduction percentage
- Add custom command mappings

**Flywheel settings** (in `server/flywheel/engine.ts`):
- Success threshold for optimization (currently 3)
- Failure threshold for review (currently 2)

## Troubleshooting

### Build fails
```bash
# Clear and rebuild
rm -rf dist node_modules client/node_modules package-lock.json
npm install && npm run build
```

### Server won't start
```bash
# Check ports aren't in use
lsof -i :3000
# Kill if needed: kill -9 <PID>

# Check environment variables
echo $GITHUB_TOKEN $ANTHROPIC_API_KEY
```

### WebSocket connection fails
- Ensure server is running: `curl http://localhost:3000/api/health`
- Check browser console for errors
- Verify URL format: `ws://localhost:3000/ws?userId=xxxxx`

### Chat responses are slow
- Check API rate limits
- Verify ANTHROPIC_API_KEY is valid
- Review token usage in agent logs

## Performance

- **Frontend**: 
  - ~150KB gzipped JavaScript
  - ~7KB CSS
  - Vite-optimized development
  
- **Backend**:
  - Real-time WebSocket streaming
  - Token reduction: 60-90% savings
  - Async operation with error recovery

- **Deployment**:
  - Cold start: ~10 seconds
  - Horizontal scaling via Railway
  - Built-in CDN for static assets

## Security

- ✅ Environment variables for all secrets
- ✅ CORS enabled for trusted origins
- ✅ GitHub token validation
- ✅ No hardcoded credentials in code
- ✅ Error messages don't leak sensitive info

## Future Enhancements

- [ ] User authentication & persistence
- [ ] Supabase integration for data storage
- [ ] Custom knowledge base ingestion
- [ ] Team collaboration features
- [ ] Scheduled autonomous runs
- [ ] Custom tool creation UI
- [ ] Plan history & replay
- [ ] Advanced analytics dashboard

## Support

For issues, suggestions, or questions:
1. Check the troubleshooting section
2. Review error logs: `railway logs`
3. Check GitHub for similar issues
4. Create a new issue with details

## License

MIT - Feel free to use, modify, and deploy!

---

**Built with**: React, Vite, Express, Claude API, Railway
**Version**: 1.0.0
**Status**: Production Ready ✨
