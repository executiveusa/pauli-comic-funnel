import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to enforce CopilotKit usage for all frontend generation
 *
 * This middleware ensures that all AI-driven frontend generation
 * goes through the Pauli Agent UI system (rebranded CopilotKit).
 *
 * Purpose: Make CopilotKit mandatory for all agents building UIs
 */

export interface FrontendGenerationRequest extends Request {
  body: {
    type?: string;
    component?: string;
    useCopilotKit?: boolean;
    [key: string]: any;
  };
}

/**
 * Enforce CopilotKit usage for frontend generation requests
 */
export function enforceCopilotKitUsage(
  req: FrontendGenerationRequest,
  res: Response,
  next: NextFunction
) {
  // Check if this is a frontend generation request
  const isFrontendRequest = (
    req.path.includes('/generate') ||
    req.path.includes('/ui') ||
    req.body.type === 'ui_generation' ||
    req.body.component
  );

  if (!isFrontendRequest) {
    // Not a frontend request, pass through
    return next();
  }

  // Force CopilotKit usage
  if (req.body.useCopilotKit === false) {
    return res.status(403).json({
      error: 'CopilotKit usage is mandatory',
      message: 'All frontend generation must use the Pauli Agent UI system (CopilotKit)',
      redirect: '/api/copilotkit',
      documentation: '/a2ui-demo',
    });
  }

  // Ensure the request is routed through CopilotKit
  req.body.useCopilotKit = true;
  req.body.framework = 'pauli-agent-ui'; // Rebranded name

  console.log(`✅ Frontend request routed through Pauli Agent UI (CopilotKit)`);

  next();
}

/**
 * Middleware to redirect non-CopilotKit UI generation to CopilotKit
 */
export function redirectToCopilotKit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // List of legacy UI generation endpoints to redirect
  const legacyEndpoints = [
    '/api/generate-ui',
    '/api/create-component',
    '/api/build-frontend',
  ];

  if (legacyEndpoints.some((endpoint) => req.path.startsWith(endpoint))) {
    return res.status(301).json({
      error: 'Endpoint deprecated',
      message: 'This endpoint has been replaced by Pauli Agent UI',
      redirect: '/api/copilotkit',
      newEndpoint: '/api/copilotkit/a2ui',
    });
  }

  next();
}

/**
 * Log all frontend generation requests for monitoring
 */
export function logFrontendGeneration(
  req: FrontendGenerationRequest,
  res: Response,
  next: NextFunction
) {
  const isFrontendRequest = (
    req.path.includes('/copilotkit') ||
    req.path.includes('/a2ui') ||
    req.body.type === 'ui_generation'
  );

  if (isFrontendRequest) {
    console.log('📊 Frontend Generation Request:', {
      path: req.path,
      method: req.method,
      framework: 'Pauli Agent UI (CopilotKit)',
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
    });
  }

  next();
}
