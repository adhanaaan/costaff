# AI Chief of Staff — Product Spec & Claude Code Prompt

## Product Name (Working): **CoStaff** (or pick your own)

## One-Liner
An AI Chief of Staff that founders configure with their company context, so their team can ideate, iterate, and execute autonomously — while the founder maintains visibility without being in the loop.

---

## How It Works

### Founder Flow
1. Signs up → creates a "workspace"
2. Uploads company docs (pitch deck, brand guidelines, product specs, SOPs)
3. Configures team roles (BD, Marketing, Video, Engineering, etc.)
4. Sets expectations per role (KPIs, frameworks, decision boundaries)
5. Adds team members (generates invite links)
6. Views dashboard: what team is working on, where they're stuck, decisions made, escalations

### Team Member Flow
1. Clicks invite link → creates account (tied to founder's workspace)
2. Opens chat → gets daily check-in: "What are you working on today?"
3. Asks questions → gets coached (Socratic, not spoon-fed) with full company context
4. Uses decision frameworks when stuck (configurable by founder)
5. Escalates to founder when needed (founder gets notified)

---

## Tech Stack

```
Frontend:     Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
Backend:      Next.js API routes + Server Actions
Database:     Supabase (Postgres + Auth + Storage + Realtime)
AI:           Anthropic Claude API (founder's API key stored encrypted)
Deployment:   Vercel (free tier to start)
```

### Why This Stack
- **Next.js**: Full-stack in one repo, fast to ship, great DX
- **Supabase**: Auth, DB, file storage, row-level security — all in one. Free tier generous.
- **Claude API**: Best reasoning model for coaching/Socratic dialogue
- **Vercel**: Zero-config deployment, free tier works for MVP

---

## Database Schema (Supabase/Postgres)

```sql
-- Workspaces (one per founder/company)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  founder_id UUID REFERENCES auth.users(id),
  anthropic_api_key_encrypted TEXT, -- encrypted via server-side
  coaching_style TEXT DEFAULT 'socratic', -- 'socratic', 'direct', 'balanced'
  custom_instructions TEXT, -- founder's custom coaching rules
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role_title TEXT NOT NULL, -- 'BD Intern', 'Video Editor', etc.
  role_config_id UUID REFERENCES role_configs(id),
  invite_token TEXT UNIQUE,
  status TEXT DEFAULT 'invited', -- 'invited', 'active', 'deactivated'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role configurations (templates set by founder)
CREATE TABLE role_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- 'Business Development', 'Content/Video', 'Email Marketing'
  success_metrics TEXT, -- what good looks like
  decision_boundaries TEXT, -- what they can decide vs escalate
  frameworks TEXT, -- decision frameworks to use
  context_prompt TEXT, -- role-specific system prompt additions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT, -- Supabase Storage path
  content_text TEXT, -- extracted text for context injection
  doc_type TEXT, -- 'pitch_deck', 'brand_guide', 'product_spec', 'sop', 'other'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  member_id UUID REFERENCES team_members(id),
  title TEXT, -- auto-generated from first message
  conversation_type TEXT DEFAULT 'chat', -- 'chat', 'daily_checkin', 'decision'
  status TEXT DEFAULT 'active', -- 'active', 'escalated', 'resolved'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- {escalated: bool, framework_used: string, confidence: string}
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
  ai_guidance TEXT, -- what the AI suggested
  founder_notes TEXT, -- founder can add async notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, date)
);

-- Escalations
CREATE TABLE escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  member_id UUID REFERENCES team_members(id),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  summary TEXT, -- AI-generated summary of what needs founder input
  context TEXT, -- relevant conversation excerpt
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
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
```

---

## Core AI System Prompt

```
You are an AI Chief of Staff for {{workspace_name}}. Your job is to coach team members to think independently and execute with speed and quality — NOT to give direct answers.

## Company Context
{{injected_document_context}}

## Your Coaching Principles

1. NEVER give direct answers to questions the team member can figure out themselves. Instead, ask 1-2 targeted questions that lead them to the answer.

2. When someone is stuck on a decision, walk them through this framework:
   - What is the fundamental goal here? (First principles)
   - What are your options? List at least 3.
   - What would you do if you had to decide in 30 seconds?
   - What's the worst case if you're wrong? Is it reversible?
   - If it's reversible → decide now, iterate later. If irreversible → escalate.

3. Apply Musk's 5-Step Process when relevant:
   - Question the requirement (should we even be doing this?)
   - Delete unnecessary steps
   - Simplify what remains
   - Accelerate the cycle time
   - Automate (only after steps 1-4)

4. Encourage high-agency behavior:
   - "What would you do if I wasn't available?"
   - "What's the 80/20 here?"
   - "Ship it imperfect, then iterate"

5. Escalation rules — tell them to escalate ONLY for:
   - Budget decisions over {{escalation_threshold}}
   - External partnership commitments
   - Strategic pivots or scope changes
   - Anything that's irreversible and high-stakes

6. Always end coaching responses with a clear next action:
   - "Your next step: [specific action]"
   - "Try this and report back: [experiment]"

## Team Member Context
Role: {{member_role_title}}
Success Metrics: {{role_success_metrics}}
Decision Boundaries: {{role_decision_boundaries}}
Frameworks: {{role_frameworks}}

{{founder_custom_instructions}}

## Conversation Style
- Be direct and concise. No fluff.
- Match the energy of a sharp, experienced co-worker — not a corporate HR bot.
- Use concrete examples from the company context when relevant.
- If you don't know something about the company, say so and suggest they check with the founder.
- Track what they're working on and reference it in future conversations.
```

---

## Pages & Routes

### Public
- `/` — Landing page (product marketing)
- `/login` — Auth (Supabase Auth with email/password or magic link)
- `/signup` — Founder signup
- `/join/[invite-token]` — Team member invite acceptance

### Founder Portal (`/dashboard`)
- `/dashboard` — Overview: team activity feed, escalations, daily check-in summaries
- `/dashboard/team` — Manage team members, roles, invite links
- `/dashboard/roles` — Configure role expectations and frameworks
- `/dashboard/knowledge` — Upload/manage company documents
- `/dashboard/settings` — API key, workspace config, coaching style
- `/dashboard/conversations/[id]` — View any team member's conversation (read-only)

### Team Member Portal (`/app`)
- `/app` — Chat interface (main interaction point)
- `/app/checkin` — Daily check-in form
- `/app/history` — Past conversations
- `/app/escalate` — Flag current conversation for founder

---

## Feature Details

### 1. Chat-Based Coaching (Non-negotiable)
The core experience. Team member asks a question, AI coaches them using company context + role expectations + Socratic method.

**Implementation:**
- Streaming responses via Claude API
- Last 20 messages as conversation history
- Inject relevant document chunks (simple keyword matching for MVP, upgrade to embeddings later)
- Role context always included in system prompt
- Save all messages to DB

**UI:** Clean chat interface. Message input at bottom. Past conversations in sidebar.

### 2. Daily Check-in Workflow (Non-negotiable)
Every day, the team member gets prompted: "What are you working on today? Any blockers?"

**Implementation:**
- Simple form: "Working on" (text) + "Blockers" (text, optional)
- On submit: AI generates brief guidance based on what they submitted + company context
- Saved to `daily_checkins` table
- Founder sees all check-ins on dashboard, can add async notes

**UI:** Card-based form. Shows AI response inline after submission.

### 3. Founder Dashboard (Non-negotiable)
Founder sees everything at a glance without reading every conversation.

**Implementation:**
- **Activity Feed**: Recent messages across all team members (newest first)
- **Escalation Queue**: Pending items that need founder input
- **Daily Check-in Summary**: What each person is working on today
- **Per-member Stats**: Message count, escalation count, last active
- **Conversation Drill-down**: Click into any conversation to read full history

**UI:** Clean dashboard with cards/sections. Mobile-responsive.

### 4. Decision Framework Templates (Non-negotiable)
When a team member says "I'm stuck" or asks a decision question, the AI walks them through a structured framework.

**Implementation:**
- Detect decision-type questions in the system prompt
- AI automatically applies the appropriate framework
- Founder can configure which frameworks are available per role
- Pre-built templates: Musk 5-Step, First Principles, BANT (for BD), Eisenhower Matrix
- Custom frameworks: founder can write their own

**UI:** Frameworks are part of the chat experience (AI applies them naturally), plus a reference page where team members can browse available frameworks.

### 5. Escalation System (Non-negotiable)
Team member can flag a conversation for the founder's attention.

**Implementation:**
- "Escalate" button in chat UI
- AI generates a summary of the conversation + what decision is needed
- Creates record in `escalations` table
- Founder sees it on dashboard
- Founder can respond (response gets injected back into the conversation)
- Optional: email/push notification to founder (post-MVP)

**UI:** Button in chat header. Escalation card on founder dashboard with context + response field.

---

## Night-One Build Plan

### Phase 1: Scaffold (30 min)
```bash
npx create-next-app@latest costaff --typescript --tailwind --app --src-dir
cd costaff
npx shadcn@latest init
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk
```

### Phase 2: Auth + Database (1 hour)
- Set up Supabase project
- Run schema SQL
- Implement auth (signup/login/invite flow)
- Row-level security policies

### Phase 3: Founder Setup (1 hour)
- API key input + encrypted storage
- Document upload (Supabase Storage + text extraction)
- Role configuration forms
- Team member invite generation

### Phase 4: Chat Interface (1.5 hours)
- Chat UI component
- API route that calls Claude with system prompt + context + history
- Streaming responses
- Message persistence
- Conversation sidebar

### Phase 5: Daily Check-in (30 min)
- Check-in form component
- AI guidance generation on submit
- Storage in daily_checkins table

### Phase 6: Dashboard (1 hour)
- Activity feed (recent messages across team)
- Escalation queue
- Check-in summary view
- Per-member stats
- Conversation drill-down

### Phase 7: Escalation Flow (30 min)
- Escalate button in chat
- AI summary generation
- Founder response flow
- Status updates

### Phase 8: Polish + Deploy (30 min)
- Responsive design pass
- Error handling
- Deploy to Vercel
- Test end-to-end

**Total: ~6-7 hours** (aggressive but doable in one night with Claude Code)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Encryption (for API keys)
ENCRYPTION_KEY=generate_a_32_byte_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Commercialization Notes (For Later)

### Pricing Model
- **Free**: 1 workspace, 2 team members, 100 messages/day, BYOK (bring your own key)
- **Pro ($49/mo)**: 1 workspace, 10 team members, unlimited messages, BYOK
- **Team ($149/mo)**: 3 workspaces, 25 team members, analytics, API key included (bundled usage)
- **Enterprise**: Custom

### Differentiators vs "Just Use Claude/ChatGPT"
1. **Founder visibility** — you see what your team is doing without asking
2. **Structured workflows** — check-ins, escalations, decision frameworks are built in
3. **Company context injection** — every response is grounded in YOUR docs/expectations
4. **Role-aware coaching** — BD gets different coaching than a video editor
5. **Async management** — founder can course-correct without a meeting

### Go-to-Market
- Use GMS as case study: "We reduced founder time from 15hrs/week to 5hrs/week"
- Share with founder network first (organic)
- Post build-in-public content on LinkedIn/X
- Target accelerator cohorts (bulk deals)
- Eventually: Notion/Slack integrations, advanced analytics, multi-AI-model support

---

## Claude Code Prompt

Copy-paste this into Claude Code to start building:

```
Build a full-stack Next.js 14 app called "CoStaff" — an AI Chief of Staff platform where founders configure an AI coach for their team.

Tech stack: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase (auth, db, storage), Anthropic Claude API, deployed on Vercel.

The app has two portals:

FOUNDER PORTAL (/dashboard):
- Dashboard overview: activity feed, escalation queue, daily check-in summaries, per-member stats
- Team management: add members, set roles, generate invite links
- Role configuration: set expectations, decision boundaries, frameworks per role
- Knowledge base: upload company docs (PDF/TXT), extract text, store for context injection
- Settings: API key (encrypted), workspace name, coaching style, custom instructions
- Conversation viewer: read any team member's conversation history

TEAM MEMBER PORTAL (/app):
- Chat interface: ask questions, get coached by AI with full company context
- Daily check-in: "What are you working on?" + "Blockers?" → AI gives guidance
- Conversation history sidebar
- Escalate button: flags conversation for founder with AI-generated summary

AUTH FLOW:
- Founders sign up normally (Supabase Auth, email/password)
- Team members join via invite link (/join/[token])
- Role-based access: founders see dashboard, team members see chat

AI COACHING:
- System prompt includes: company docs, role expectations, decision frameworks, coaching principles
- Socratic method: asks questions instead of giving direct answers
- Musk's 5-step process for decision-making
- Streams responses via Claude API
- Saves all messages to database
- Injects last 20 messages as conversation history

DATABASE:
[Include the full schema from above]

DESIGN:
- Clean, modern, professional. Dark mode optional.
- Chat UI similar to ChatGPT/Claude interface
- Dashboard with card-based layout
- Mobile responsive

Start by setting up the project structure, then build auth, then founder portal, then team portal, then connect AI.
```
