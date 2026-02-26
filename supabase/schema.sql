-- CoStaff Database Schema
-- Run this in Supabase SQL Editor after creating your project

-- Workspaces (one per founder/company)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  founder_id UUID REFERENCES auth.users(id),
  anthropic_api_key_encrypted TEXT,
  coaching_style TEXT DEFAULT 'socratic',
  custom_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role configurations (templates set by founder)
CREATE TABLE role_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  success_metrics TEXT,
  decision_boundaries TEXT,
  frameworks TEXT,
  context_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role_title TEXT NOT NULL,
  role_config_id UUID REFERENCES role_configs(id),
  invite_token TEXT UNIQUE,
  status TEXT DEFAULT 'invited',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT,
  content_text TEXT,
  doc_type TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  member_id UUID REFERENCES team_members(id),
  title TEXT,
  conversation_type TEXT DEFAULT 'chat',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily check-ins
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  member_id UUID REFERENCES team_members(id),
  date DATE DEFAULT CURRENT_DATE,
  working_on TEXT,
  blockers TEXT,
  ai_guidance TEXT,
  founder_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, date)
);

-- Escalations
CREATE TABLE escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  member_id UUID REFERENCES team_members(id),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  summary TEXT,
  context TEXT,
  status TEXT DEFAULT 'pending',
  founder_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Workspaces: founders can manage their own
CREATE POLICY "Founders can view own workspaces" ON workspaces
  FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "Founders can update own workspaces" ON workspaces
  FOR UPDATE USING (founder_id = auth.uid());
CREATE POLICY "Founders can insert workspaces" ON workspaces
  FOR INSERT WITH CHECK (founder_id = auth.uid());

-- Team members: founders see all in workspace, members see themselves
CREATE POLICY "Founders see team" ON team_members
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE founder_id = auth.uid())
  );
CREATE POLICY "Members see self" ON team_members
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Founders manage team" ON team_members
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE founder_id = auth.uid())
  );
-- Allow checking invite tokens for the join flow
CREATE POLICY "Anyone can check invite tokens" ON team_members
  FOR SELECT USING (invite_token IS NOT NULL AND status = 'invited');

-- Role configs: workspace-scoped
CREATE POLICY "Founders manage roles" ON role_configs
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE founder_id = auth.uid())
  );
CREATE POLICY "Members see roles" ON role_configs
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid())
  );

-- Documents: workspace-scoped
CREATE POLICY "Founders manage documents" ON documents
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE founder_id = auth.uid())
  );
CREATE POLICY "Members see documents" ON documents
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM team_members WHERE user_id = auth.uid())
  );

-- Conversations: members see own, founders see all in workspace
CREATE POLICY "Members manage own conversations" ON conversations
  FOR ALL USING (
    member_id IN (SELECT id FROM team_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Founders see all conversations" ON conversations
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE founder_id = auth.uid())
  );

-- Messages: through conversation access
CREATE POLICY "Members manage own messages" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE member_id IN (
        SELECT id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Founders see all messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE founder_id = auth.uid()
      )
    )
  );

-- Daily check-ins: members manage own, founders see all
CREATE POLICY "Members manage own checkins" ON daily_checkins
  FOR ALL USING (
    member_id IN (SELECT id FROM team_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Founders see all checkins" ON daily_checkins
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE founder_id = auth.uid())
  );
CREATE POLICY "Founders update checkins" ON daily_checkins
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE founder_id = auth.uid())
  );

-- Escalations: members create own, founders manage all
CREATE POLICY "Members create escalations" ON escalations
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM team_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Members see own escalations" ON escalations
  FOR SELECT USING (
    member_id IN (SELECT id FROM team_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Founders manage escalations" ON escalations
  FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE founder_id = auth.uid())
  );

-- Create storage bucket for documents (run separately or via dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
