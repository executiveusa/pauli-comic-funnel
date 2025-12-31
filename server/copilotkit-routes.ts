import { Router, Request, Response } from 'express';
import { CopilotRuntime } from '@copilotkit/runtime';
import Anthropic from '@anthropic-ai/sdk';

/**
 * CopilotKit API Routes for Pauli Effect Project (Rebranded)
 *
 * Provides backend endpoints for CopilotKit integration,
 * enabling AI-powered chat and agent-driven UI generation.
 *
 * CopilotKit is rebranded as "Pauli Agent UI" in this system.
 */

const router = Router();

// Validate required environment variables
if (!process.env.COPILOTKIT_API_KEY) {
  console.warn('⚠️  COPILOTKIT_API_KEY not set in environment variables');
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY not set in environment variables');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// CopilotKit configuration with API key
const copilotKitConfig = {
  apiKey: process.env.COPILOTKIT_API_KEY,
  publicKey: process.env.COPILOTKIT_API_KEY, // For public key authentication
};

/**
 * CopilotKit Runtime Handler
 *
 * This endpoint handles all CopilotKit communication including:
 * - Chat messages
 * - Agent actions
 * - A2UI rendering requests
 */
router.post('/copilotkit', async (req: Request, res: Response) => {
  try {
    // Initialize CopilotKit runtime
    const runtime = new CopilotRuntime({
      // Configure agents and tools here
      // For now, we'll set up a basic chat agent
    });

    // Handle the request using CopilotKit runtime
    // Note: This is a simplified version - full implementation
    // would use CopilotKit's request handling
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request: messages array required',
      });
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are PAULI, the AI assistant for THE PAULI EFFECT project.

You are a helpful AI that can:
- Generate interactive user interfaces using A2UI protocol
- Help with physics concepts and explanations
- Assist with web development and design tasks
- Create visualizations and interactive components

When asked to create UIs or interfaces, you should use the A2UI protocol to generate
declarative JSON that describes the UI components. You can create forms, cards, buttons,
text fields, and other interactive elements.

Be creative, helpful, and enthusiastic about helping users build amazing interfaces!`,
      messages: messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    });

    // Extract response text
    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Return response in CopilotKit format
    res.json({
      messages: [
        ...messages,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: assistantMessage,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error('CopilotKit error:', error);
    res.status(500).json({
      error: 'Failed to process CopilotKit request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * A2UI Agent Endpoint
 *
 * Dedicated endpoint for A2UI generation requests
 */
router.post('/copilotkit/a2ui', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are an A2UI generation agent for THE PAULI EFFECT project.

Generate A2UI JSON payloads that describe user interfaces. A2UI is a declarative format
where you describe the UI structure and components, not executable code.

Available component types:
- card: Container for content
- text: Display text
- text-field: Input field
- button: Interactive button
- select: Dropdown selection
- checkbox: Checkbox input
- slider: Range slider
- date-picker: Date selection
- image: Display images

Return ONLY valid JSON in the A2UI format. Example:
{
  "components": [
    {
      "id": "card-1",
      "type": "card",
      "properties": {
        "title": "Welcome",
        "children": ["text-1"]
      }
    },
    {
      "id": "text-1",
      "type": "text",
      "properties": {
        "content": "Hello world!"
      }
    }
  ]
}`,
      messages: [
        {
          role: 'user',
          content: `Generate an A2UI interface for: ${prompt}`,
        },
      ],
    });

    const a2uiJson =
      response.content[0].type === 'text' ? response.content[0].text : '{}';

    res.json({
      a2ui: a2uiJson,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('A2UI generation error:', error);
    res.status(500).json({ error: 'Failed to generate A2UI' });
  }
});

/**
 * Health check for CopilotKit service
 */
router.get('/copilotkit/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'copilotkit',
    features: ['chat', 'a2ui', 'agents'],
    timestamp: new Date().toISOString(),
  });
});

export default router;
