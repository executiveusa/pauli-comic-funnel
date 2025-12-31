import { Router, Request, Response } from 'express';
import { getAGIOpenService, LuxMode } from './services/agi-open';

/**
 * AGI Open API Routes for Pauli Effect Project
 *
 * Provides endpoints for computer-use automation through Lux model.
 * All routes require authentication (internal team only).
 */

const router = Router();
const agiOpenService = getAGIOpenService();

/**
 * Execute a computer-use automation task
 *
 * POST /api/agi-open/execute
 *
 * Body:
 * {
 *   "task": "string - description of task to automate",
 *   "mode": "actor" | "thinker" | "tasker" (optional, default: "actor")
 * }
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { task, mode = 'actor' } = req.body;

    if (!task) {
      return res.status(400).json({
        error: 'Task description is required',
      });
    }

    if (!['actor', 'thinker', 'tasker'].includes(mode)) {
      return res.status(400).json({
        error: 'Invalid mode. Must be: actor, thinker, or tasker',
      });
    }

    const result = await agiOpenService.executeTask(task, { mode: mode as LuxMode });

    res.json({
      success: true,
      task: result,
    });
  } catch (error) {
    console.error('AGI Open execution error:', error);
    res.status(500).json({
      error: 'Failed to execute task',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Plan a multi-step task using Thinker mode
 *
 * POST /api/agi-open/plan
 *
 * Body:
 * {
 *   "goal": "string - high-level goal to plan"
 * }
 */
router.post('/plan', async (req: Request, res: Response) => {
  try {
    const { goal } = req.body;

    if (!goal) {
      return res.status(400).json({
        error: 'Goal description is required',
      });
    }

    const plan = await agiOpenService.planTask(goal);

    res.json({
      success: true,
      goal,
      plan,
    });
  } catch (error) {
    console.error('AGI Open planning error:', error);
    res.status(500).json({
      error: 'Failed to plan task',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get task status and result
 *
 * GET /api/agi-open/status/:taskId
 */
router.get('/status/:taskId', (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const task = agiOpenService.getTask(taskId);

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        taskId,
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('AGI Open status error:', error);
    res.status(500).json({
      error: 'Failed to get task status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * List recent tasks
 *
 * GET /api/agi-open/tasks?limit=50
 */
router.get('/tasks', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const tasks = agiOpenService.listTasks(limit);

    res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('AGI Open list tasks error:', error);
    res.status(500).json({
      error: 'Failed to list tasks',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Health check for AGI Open service
 *
 * GET /api/agi-open/health
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await agiOpenService.healthCheck();

    res.json({
      service: 'agi-open',
      ...health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      service: 'agi-open',
      configured: false,
      status: 'offline',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
