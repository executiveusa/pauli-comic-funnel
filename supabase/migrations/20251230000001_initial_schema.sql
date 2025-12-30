-- THE PAULI EFFECT - Initial Database Schema
-- Migration: 20251230000001_initial_schema
-- Purpose: Core tables for autonomous AI system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  client_name TEXT,
  budget DECIMAL(10, 2),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  notion_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'blocked', 'completed', 'cancelled')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to TEXT, -- Agent ID or human name
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notion_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CLOUD SKILLS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cloud_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id TEXT UNIQUE NOT NULL, -- e.g., "01-deployment-devops"
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'deprecated')),
  orchestrator_agent_id TEXT NOT NULL,
  sub_agents JSONB DEFAULT '[]', -- Array of sub-agent configs
  tools JSONB DEFAULT '[]', -- Array of tool names
  dependencies JSONB DEFAULT '[]', -- Array of dependencies
  approval_required BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 2), -- Percentage 0-100
  avg_execution_time INTEGER, -- Milliseconds
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AGENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT UNIQUE NOT NULL, -- e.g., "PAULI-PRIME"
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  model TEXT NOT NULL, -- e.g., "claude-sonnet-4-5-20250929"
  agent_type TEXT CHECK (agent_type IN ('orchestrator', 'skill', 'sub-agent', 'review', 'monitor')),
  parent_agent_id TEXT, -- References another agent_id
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deprecated')),
  capabilities JSONB DEFAULT '[]', -- Array of capabilities
  tools JSONB DEFAULT '[]', -- Array of tools available
  performance_metrics JSONB DEFAULT '{}', -- {commands_processed, success_rate, avg_response_time}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DECISIONS TABLE (Architecture Decision Records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  context TEXT NOT NULL, -- Why this decision was needed
  decision TEXT NOT NULL, -- What was decided
  rationale TEXT, -- Why this decision was made
  alternatives JSONB DEFAULT '[]', -- Array of considered alternatives
  consequences TEXT, -- What this decision implies
  status TEXT DEFAULT 'accepted' CHECK (status IN ('proposed', 'accepted', 'deprecated', 'superseded')),
  decided_by TEXT, -- Agent ID or human name
  decided_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notion_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FINANCIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'investment', 'refund')),
  category TEXT, -- e.g., "client_payment", "infrastructure", "subscription"
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method TEXT, -- e.g., "stripe", "wire_transfer", "cash"
  stripe_transaction_id TEXT,
  notion_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- AGENT EXECUTIONS TABLE (Lightning Agent Monitoring)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL, -- References agents.agent_id
  skill_id TEXT, -- References cloud_skills.skill_id
  command TEXT NOT NULL, -- User command or trigger
  status TEXT CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  execution_time INTEGER, -- Milliseconds
  success BOOLEAN,
  error_message TEXT,
  input_context JSONB DEFAULT '{}', -- Input data
  output_result JSONB DEFAULT '{}', -- Output data
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- LEARNING INSIGHTS TABLE (Lightning Agent Learning)
-- ============================================================================
CREATE TABLE IF NOT EXISTS learning_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_type TEXT CHECK (insight_type IN ('optimization', 'pattern', 'anomaly', 'improvement')),
  title TEXT NOT NULL,
  description TEXT,
  agent_id TEXT, -- Which agent this insight is about
  skill_id TEXT, -- Which skill this insight is about
  data JSONB DEFAULT '{}', -- Supporting data
  confidence_score DECIMAL(5, 2), -- 0-100 confidence in this insight
  applied BOOLEAN DEFAULT false, -- Whether this insight was applied
  applied_at TIMESTAMP WITH TIME ZONE,
  impact_metrics JSONB DEFAULT '{}', -- Measured impact after applying
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- VOICE COMMANDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS voice_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  command_text TEXT NOT NULL, -- Transcribed voice command
  intent TEXT, -- Parsed intent
  skill_routed_to TEXT, -- Which skill was selected
  approval_status TEXT CHECK (approval_status IN ('auto_approved', 'pending', 'approved', 'rejected')),
  executed BOOLEAN DEFAULT false,
  execution_id UUID REFERENCES agent_executions(id) ON DELETE SET NULL,
  audio_url TEXT, -- URL to audio file if stored
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

-- Projects indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_notion_id ON projects(notion_id);

-- Tasks indexes
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Cloud Skills indexes
CREATE INDEX idx_cloud_skills_skill_id ON cloud_skills(skill_id);
CREATE INDEX idx_cloud_skills_status ON cloud_skills(status);

-- Agents indexes
CREATE INDEX idx_agents_agent_id ON agents(agent_id);
CREATE INDEX idx_agents_agent_type ON agents(agent_type);
CREATE INDEX idx_agents_parent_agent_id ON agents(parent_agent_id);

-- Decisions indexes
CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_decisions_decided_at ON decisions(decided_at);

-- Financials indexes
CREATE INDEX idx_financials_transaction_type ON financials(transaction_type);
CREATE INDEX idx_financials_project_id ON financials(project_id);
CREATE INDEX idx_financials_transaction_date ON financials(transaction_date);

-- Agent Executions indexes
CREATE INDEX idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX idx_agent_executions_skill_id ON agent_executions(skill_id);
CREATE INDEX idx_agent_executions_status ON agent_executions(status);
CREATE INDEX idx_agent_executions_started_at ON agent_executions(started_at);

-- Learning Insights indexes
CREATE INDEX idx_learning_insights_agent_id ON learning_insights(agent_id);
CREATE INDEX idx_learning_insights_skill_id ON learning_insights(skill_id);
CREATE INDEX idx_learning_insights_insight_type ON learning_insights(insight_type);
CREATE INDEX idx_learning_insights_applied ON learning_insights(applied);

-- Voice Commands indexes
CREATE INDEX idx_voice_commands_approval_status ON voice_commands(approval_status);
CREATE INDEX idx_voice_commands_executed ON voice_commands(executed);
CREATE INDEX idx_voice_commands_created_at ON voice_commands(created_at);

-- ============================================================================
-- TRIGGERS for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cloud_skills_updated_at BEFORE UPDATE ON cloud_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financials_updated_at BEFORE UPDATE ON financials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_insights_updated_at BEFORE UPDATE ON learning_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voice_commands_updated_at BEFORE UPDATE ON voice_commands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - To be configured based on auth requirements
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;

-- Default policy: Allow all for authenticated users (will be refined)
CREATE POLICY "Allow all for authenticated users" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON cloud_skills FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON decisions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON financials FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON agent_executions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON learning_insights FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON voice_commands FOR ALL USING (true);

-- ============================================================================
-- SEED DATA: Initial agents
-- ============================================================================

INSERT INTO agents (agent_id, name, role, model, agent_type, status) VALUES
('PAULI-PRIME', 'PAULI-PRIME', 'Master Orchestrator & Decision Engine', 'claude-sonnet-4-5-20250929', 'orchestrator', 'active'),
('LIGHTNING-MONITOR', 'Lightning Monitor', 'Continuous Learning & Performance Optimization', 'claude-sonnet-4-5-20250929', 'monitor', 'active'),
('CODER-AGENT', 'Coder Agent', 'Code Generation', 'claude-sonnet-4-5-20250929', 'review', 'active'),
('VALIDATOR-AGENT', 'Validator Agent', 'Code Review & Validation', 'claude-sonnet-4-5-20250929', 'review', 'active')
ON CONFLICT (agent_id) DO NOTHING;

-- ============================================================================
-- SEED DATA: Initial Cloud Skills
-- ============================================================================

INSERT INTO cloud_skills (skill_id, name, description, orchestrator_agent_id, status) VALUES
('01-deployment-devops', 'Deployment/DevOps', 'Deploy and manage infrastructure', 'DEVOPS-ORCHESTRATOR', 'pending'),
('02-ui-ux-design', 'UI/UX Design', 'Design and validate user interfaces', 'DESIGN-ORCHESTRATOR', 'pending'),
('03-marketing-growth', 'Marketing/Growth', 'Drive user acquisition and revenue', 'GROWTH-ORCHESTRATOR', 'pending'),
('04-fundraising-investor', 'Fundraising/Investor', 'Manage investor relations and fundraising', 'FUNDRAISING-ORCHESTRATOR', 'pending'),
('05-finance-ops', 'Finance/Ops', 'Track and optimize financial operations', 'FINANCE-ORCHESTRATOR', 'pending'),
('06-client-delivery', 'Client Delivery', 'Deliver client projects with excellence', 'CLIENT-ORCHESTRATOR', 'pending'),
('07-avatar-comic-scriptwriter', 'Avatar/Comic Scriptwriter', 'Create compelling narratives and characters', 'STORYTELLING-ORCHESTRATOR', 'pending'),
('08-web-artifacts-builder', 'Web Artifacts Builder', 'Build production-ready web components', 'ARTIFACTS-ORCHESTRATOR', 'pending'),
('09-algorithmic-art', 'Algorithmic Art', 'Create algorithmic and generative art', 'GENERATIVE-ART-ORCHESTRATOR', 'pending'),
('10-theme-factory', 'Theme Factory', 'Generate and manage design systems', 'THEME-ORCHESTRATOR', 'pending'),
('11-mcp-builder', 'MCP Builder', 'Build Model Context Protocol servers', 'MCP-ORCHESTRATOR', 'pending'),
('12-skill-creator', 'Skill Creator', 'Create new Cloud Skills as needed', 'META-SKILL-ORCHESTRATOR', 'pending'),
('13-brand-guidelines', 'Brand Guidelines', 'Enforce brand consistency', 'BRAND-ORCHESTRATOR', 'pending'),
('14-internal-comms', 'Internal Comms', 'Manage internal communication', 'COMMS-ORCHESTRATOR', 'pending'),
('15-gratitude-department', 'Gratitude Department', 'Cultivate relationships through appreciation', 'GRATITUDE-ORCHESTRATOR', 'pending'),
('16-crypto-web3', 'Crypto/Web3', 'Navigate blockchain and crypto integrations', 'WEB3-ORCHESTRATOR', 'pending'),
('17-voice-jarvis', 'Voice/Jarvis', 'Enable voice control and interaction', 'VOICE-ORCHESTRATOR', 'pending'),
('18-legacy-keeper', 'Legacy Keeper', 'Preserve knowledge for future generations', 'LEGACY-ORCHESTRATOR', 'pending')
ON CONFLICT (skill_id) DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON SCHEMA public IS 'THE PAULI EFFECT - Autonomous AI System Database';
