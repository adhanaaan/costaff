export interface Workspace {
  id: string
  name: string
  founder_id: string
  anthropic_api_key_encrypted: string | null
  coaching_style: "socratic" | "direct" | "balanced"
  custom_instructions: string | null
  created_at: string
}

export interface TeamMember {
  id: string
  workspace_id: string
  user_id: string | null
  name: string
  email: string
  role_title: string
  role_config_id: string | null
  invite_token: string | null
  status: "invited" | "active" | "deactivated"
  created_at: string
  // Joined fields
  role_config?: RoleConfig | null
}

export interface RoleConfig {
  id: string
  workspace_id: string
  title: string
  success_metrics: string | null
  decision_boundaries: string | null
  frameworks: string | null
  context_prompt: string | null
  created_at: string
}

export interface Document {
  id: string
  workspace_id: string
  name: string
  file_path: string | null
  content_text: string | null
  doc_type: "pitch_deck" | "brand_guide" | "product_spec" | "sop" | "other"
  created_at: string
}

export interface Conversation {
  id: string
  workspace_id: string
  member_id: string
  title: string | null
  conversation_type: "chat" | "daily_checkin" | "decision"
  status: "active" | "escalated" | "resolved"
  created_at: string
  updated_at: string
  // Joined fields
  team_member?: TeamMember | null
}

export interface Message {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface DailyCheckin {
  id: string
  workspace_id: string
  member_id: string
  date: string
  working_on: string | null
  blockers: string | null
  ai_guidance: string | null
  founder_notes: string | null
  created_at: string
  // Joined fields
  team_member?: TeamMember | null
}

export interface Escalation {
  id: string
  conversation_id: string
  member_id: string
  workspace_id: string
  summary: string | null
  context: string | null
  status: "pending" | "resolved" | "dismissed"
  founder_response: string | null
  created_at: string
  resolved_at: string | null
  // Joined fields
  team_member?: TeamMember | null
  conversation?: Conversation | null
}
