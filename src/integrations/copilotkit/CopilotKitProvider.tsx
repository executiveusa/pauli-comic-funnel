import React from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';

interface CopilotKitProviderProps {
  children: React.ReactNode;
  runtimeUrl?: string;
}

/**
 * CopilotKit Provider for the Pauli Effect Project
 *
 * Wraps the application with CopilotKit context to enable AI-powered features
 * and agent-driven UI generation using A2UI protocol.
 */
export const PauliCopilotKitProvider: React.FC<CopilotKitProviderProps> = ({
  children,
  runtimeUrl = '/api/copilotkit',
}) => {
  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      showDevConsole={import.meta.env.DEV}
    >
      {children}
    </CopilotKit>
  );
};
