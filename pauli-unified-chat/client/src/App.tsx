import { useState, useEffect, useRef } from 'react';
import { api, ChatMessage } from './lib/api';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import './App.css';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentStream, setCurrentStream] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
    // Health check
    api.getHealth().catch(console.error);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStream]);

  const loadProjects = async () => {
    try {
      const projects = await api.listProjects();
      setProjects(projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentStream('');

    try {
      // Stream the response
      await api.streamMessage(message, (chunk) => {
        setCurrentStream(prev => prev + chunk);
      });

      // Add assistant message
      if (currentStream) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: currentStream,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentStream('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1>PAULI</h1>
          <p className="subtitle">Your 2nd Brain</p>
        </div>

        <div className="sidebar-section">
          <h3>Projects</h3>
          <div className="projects-list">
            {projects.length > 0 ? (
              projects.map((project, idx) => (
                <div key={idx} className="project-item">
                  <span className="project-name">{project.name}</span>
                  <span className="project-status" data-status={project.status}>
                    {project.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-state">No projects loaded</p>
            )}
          </div>
        </div>

        <button
          className="toggle-sidebar"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? '←' : '→'}
        </button>
      </div>

      <div className="main-container">
        <header className="app-header">
          <h2>Chat with PAULI</h2>
          <p className="header-subtitle">Plan • Execute • Learn • Improve</p>
        </header>

        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          currentStream={currentStream}
          chatEndRef={chatEndRef}
        />

        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
