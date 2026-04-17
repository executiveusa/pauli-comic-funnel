import { ChatMessage } from '../lib/api';
import './ChatWindow.css';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  currentStream: string;
  chatEndRef: React.RefObject<HTMLDivElement>;
}

export default function ChatWindow({
  messages,
  isLoading,
  currentStream,
  chatEndRef
}: ChatWindowProps) {
  return (
    <div className="chat-window">
      {messages.length === 0 && !currentStream ? (
        <div className="empty-chat">
          <div className="welcome-container">
            <h1>Welcome to PAULI</h1>
            <p>Your unified second brain for GitHub projects</p>
            <div className="features">
              <div className="feature">
                <span className="icon">🧠</span>
                <span>Understand your projects</span>
              </div>
              <div className="feature">
                <span className="icon">📋</span>
                <span>Create executable plans</span>
              </div>
              <div className="feature">
                <span className="icon">⚙️</span>
                <span>Execute autonomously</span>
              </div>
              <div className="feature">
                <span className="icon">📈</span>
                <span>Learn and improve</span>
              </div>
            </div>
            <p className="hint">Start by asking about your projects or what you'd like to build</p>
          </div>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message message-${msg.role}`}>
              <div className="message-content">
                {msg.role === 'user' ? '👤' : '🤖'} {msg.content}
              </div>
            </div>
          ))}

          {isLoading && currentStream && (
            <div className="message message-assistant">
              <div className="message-content streaming">
                🤖 {currentStream}
                <span className="cursor">▌</span>
              </div>
            </div>
          )}

          {isLoading && !currentStream && (
            <div className="message message-assistant">
              <div className="message-content thinking">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      )}
    </div>
  );
}
