// THE PAULI EFFECT - Database Types
// Auto-generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          agent_id: string
          name: string
          role: string
          model: string
          agent_type: 'orchestrator' | 'skill' | 'sub-agent' | 'review' | 'monitor' | null
          parent_agent_id: string | null
          status: 'active' | 'paused' | 'deprecated'
          capabilities: Json
          tools: Json
          performance_metrics: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          name: string
          role: string
          model: string
          agent_type?: 'orchestrator' | 'skill' | 'sub-agent' | 'review' | 'monitor' | null
          parent_agent_id?: string | null
          status?: 'active' | 'paused' | 'deprecated'
          capabilities?: Json
          tools?: Json
          performance_metrics?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          name?: string
          role?: string
          model?: string
          agent_type?: 'orchestrator' | 'skill' | 'sub-agent' | 'review' | 'monitor' | null
          parent_agent_id?: string | null
          status?: 'active' | 'paused' | 'deprecated'
          capabilities?: Json
          tools?: Json
          performance_metrics?: Json
          created_at?: string
          updated_at?: string
        }
      }
      cloud_skills: {
        Row: {
          id: string
          skill_id: string
          name: string
          description: string | null
          version: string
          status: 'pending' | 'active' | 'deprecated'
          orchestrator_agent_id: string
          sub_agents: Json
          tools: Json
          dependencies: Json
          approval_required: boolean
          usage_count: number
          success_rate: number | null
          avg_execution_time: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          skill_id: string
          name: string
          description?: string | null
          version?: string
          status?: 'pending' | 'active' | 'deprecated'
          orchestrator_agent_id: string
          sub_agents?: Json
          tools?: Json
          dependencies?: Json
          approval_required?: boolean
          usage_count?: number
          success_rate?: number | null
          avg_execution_time?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          skill_id?: string
          name?: string
          description?: string | null
          version?: string
          status?: 'pending' | 'active' | 'deprecated'
          orchestrator_agent_id?: string
          sub_agents?: Json
          tools?: Json
          dependencies?: Json
          approval_required?: boolean
          usage_count?: number
          success_rate?: number | null
          avg_execution_time?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'active' | 'completed' | 'paused' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'critical' | null
          client_name: string | null
          budget: number | null
          start_date: string | null
          end_date: string | null
          notion_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical' | null
          client_name?: string | null
          budget?: number | null
          start_date?: string | null
          end_date?: string | null
          notion_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical' | null
          client_name?: string | null
          budget?: number | null
          start_date?: string | null
          end_date?: string | null
          notion_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string | null
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'critical' | null
          assigned_to: string | null
          due_date: string | null
          completed_at: string | null
          notion_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical' | null
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          notion_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical' | null
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          notion_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      decisions: {
        Row: {
          id: string
          title: string
          context: string
          decision: string
          rationale: string | null
          alternatives: Json
          consequences: string | null
          status: 'proposed' | 'accepted' | 'deprecated' | 'superseded'
          decided_by: string | null
          decided_at: string
          notion_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          context: string
          decision: string
          rationale?: string | null
          alternatives?: Json
          consequences?: string | null
          status?: 'proposed' | 'accepted' | 'deprecated' | 'superseded'
          decided_by?: string | null
          decided_at?: string
          notion_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          context?: string
          decision?: string
          rationale?: string | null
          alternatives?: Json
          consequences?: string | null
          status?: 'proposed' | 'accepted' | 'deprecated' | 'superseded'
          decided_by?: string | null
          decided_at?: string
          notion_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      financials: {
        Row: {
          id: string
          transaction_type: 'income' | 'expense' | 'investment' | 'refund'
          category: string | null
          amount: number
          currency: string
          description: string | null
          project_id: string | null
          transaction_date: string
          payment_method: string | null
          stripe_transaction_id: string | null
          notion_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transaction_type: 'income' | 'expense' | 'investment' | 'refund'
          category?: string | null
          amount: number
          currency?: string
          description?: string | null
          project_id?: string | null
          transaction_date?: string
          payment_method?: string | null
          stripe_transaction_id?: string | null
          notion_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transaction_type?: 'income' | 'expense' | 'investment' | 'refund'
          category?: string | null
          amount?: number
          currency?: string
          description?: string | null
          project_id?: string | null
          transaction_date?: string
          payment_method?: string | null
          stripe_transaction_id?: string | null
          notion_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      agent_executions: {
        Row: {
          id: string
          agent_id: string
          skill_id: string | null
          command: string
          status: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | null
          started_at: string
          completed_at: string | null
          execution_time: number | null
          success: boolean | null
          error_message: string | null
          input_context: Json
          output_result: Json
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          skill_id?: string | null
          command: string
          status?: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | null
          started_at?: string
          completed_at?: string | null
          execution_time?: number | null
          success?: boolean | null
          error_message?: string | null
          input_context?: Json
          output_result?: Json
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          skill_id?: string | null
          command?: string
          status?: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | null
          started_at?: string
          completed_at?: string | null
          execution_time?: number | null
          success?: boolean | null
          error_message?: string | null
          input_context?: Json
          output_result?: Json
          metadata?: Json
          created_at?: string
        }
      }
      learning_insights: {
        Row: {
          id: string
          insight_type: 'optimization' | 'pattern' | 'anomaly' | 'improvement' | null
          title: string
          description: string | null
          agent_id: string | null
          skill_id: string | null
          data: Json
          confidence_score: number | null
          applied: boolean
          applied_at: string | null
          impact_metrics: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          insight_type?: 'optimization' | 'pattern' | 'anomaly' | 'improvement' | null
          title: string
          description?: string | null
          agent_id?: string | null
          skill_id?: string | null
          data?: Json
          confidence_score?: number | null
          applied?: boolean
          applied_at?: string | null
          impact_metrics?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          insight_type?: 'optimization' | 'pattern' | 'anomaly' | 'improvement' | null
          title?: string
          description?: string | null
          agent_id?: string | null
          skill_id?: string | null
          data?: Json
          confidence_score?: number | null
          applied?: boolean
          applied_at?: string | null
          impact_metrics?: Json
          created_at?: string
          updated_at?: string
        }
      }
      voice_commands: {
        Row: {
          id: string
          command_text: string
          intent: string | null
          skill_routed_to: string | null
          approval_status: 'auto_approved' | 'pending' | 'approved' | 'rejected' | null
          executed: boolean
          execution_id: string | null
          audio_url: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          command_text: string
          intent?: string | null
          skill_routed_to?: string | null
          approval_status?: 'auto_approved' | 'pending' | 'approved' | 'rejected' | null
          executed?: boolean
          execution_id?: string | null
          audio_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          command_text?: string
          intent?: string | null
          skill_routed_to?: string | null
          approval_status?: 'auto_approved' | 'pending' | 'approved' | 'rejected' | null
          executed?: boolean
          execution_id?: string | null
          audio_url?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
