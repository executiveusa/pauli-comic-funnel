import React from 'react';
import { useCopilotChat } from '@copilotkit/react-core';
import { pauliA2UITheme } from './theme';

interface A2UIChatProps {
  className?: string;
  placeholder?: string;
}

/**
 * A2UI-Enabled Chat Component for Pauli Effect
 *
 * This component provides an AI chat interface that can render
 * agent-generated UIs using the A2UI protocol. Agents can create
 * dynamic, interactive interfaces on-the-fly during conversations.
 *
 * Features:
 * - Secure, declarative UI generation
 * - Real-time agent communication
 * - Custom Pauli Effect theming
 * - Support for rich, interactive components
 */
export const A2UIChat: React.FC<A2UIChatProps> = ({
  className = '',
  placeholder = 'Ask the Pauli Effect AI anything...',
}) => {
  const {
    visibleMessages,
    appendMessage,
    setMessages,
    isLoading,
  } = useCopilotChat();

  const [inputValue, setInputValue] = React.useState('');

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || isLoading) return;

      appendMessage({
        role: 'user',
        content: inputValue,
      });

      setInputValue('');
    },
    [inputValue, isLoading, appendMessage]
  );

  return (
    <div
      className={`a2ui-chat-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: pauliA2UITheme.backgroundColor,
        color: pauliA2UITheme.textColor,
        fontFamily: pauliA2UITheme.fontFamily,
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: `1px solid ${pauliA2UITheme.borderColor}`,
          backgroundColor: pauliA2UITheme.surfaceColor,
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
          🪁 Pauli Effect AI Assistant
        </h2>
        <p
          style={{
            margin: '0.25rem 0 0',
            fontSize: '0.875rem',
            color: pauliA2UITheme.textSecondaryColor,
          }}
        >
          Powered by CopilotKit + A2UI
        </p>
      </div>

      {/* Messages Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {visibleMessages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '1rem',
              color: pauliA2UITheme.textSecondaryColor,
            }}
          >
            <div style={{ fontSize: '3rem' }}>🎨</div>
            <p style={{ fontSize: '1.125rem', textAlign: 'center' }}>
              Ask me to create interfaces, visualizations, or interactive components
            </p>
            <p style={{ fontSize: '0.875rem', textAlign: 'center', maxWidth: '500px' }}>
              I can generate dynamic UIs using A2UI - try asking for forms, dashboards,
              data visualizations, or any interactive component you need!
            </p>
          </div>
        ) : (
          visibleMessages.map((message, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                borderRadius: pauliA2UITheme.borderRadius,
                backgroundColor:
                  message.role === 'user'
                    ? pauliA2UITheme.components.card.backgroundColor
                    : pauliA2UITheme.surfaceColor,
                border: `1px solid ${pauliA2UITheme.borderColor}`,
                maxWidth: message.role === 'user' ? '80%' : '100%',
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: pauliA2UITheme.textSecondaryColor,
                  marginBottom: '0.5rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {message.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
              </div>
              <div>{message.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div
            style={{
              padding: '1rem',
              borderRadius: pauliA2UITheme.borderRadius,
              backgroundColor: pauliA2UITheme.surfaceColor,
              border: `1px solid ${pauliA2UITheme.borderColor}`,
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <div className="loading-spinner">⏳</div>
            <span style={{ color: pauliA2UITheme.textSecondaryColor }}>
              AI is thinking...
            </span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '1rem',
          borderTop: `1px solid ${pauliA2UITheme.borderColor}`,
          backgroundColor: pauliA2UITheme.surfaceColor,
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: pauliA2UITheme.components.input.padding,
              borderRadius: pauliA2UITheme.components.input.borderRadius,
              border: `1px solid ${pauliA2UITheme.components.input.borderColor}`,
              backgroundColor: pauliA2UITheme.components.input.backgroundColor,
              color: pauliA2UITheme.components.input.textColor,
              fontSize: '1rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: pauliA2UITheme.components.button.padding,
              borderRadius: pauliA2UITheme.components.button.borderRadius,
              border: 'none',
              backgroundColor: pauliA2UITheme.components.button.primaryBackground,
              color: pauliA2UITheme.components.button.primaryColor,
              fontSize: '1rem',
              fontWeight: 600,
              cursor: !inputValue.trim() || isLoading ? 'not-allowed' : 'pointer',
              opacity: !inputValue.trim() || isLoading ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};
