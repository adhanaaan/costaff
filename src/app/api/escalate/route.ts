import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { conversationId } = await req.json()

  // Get team member
  const { data: member } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!member) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 })
  }

  // Get workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", member.workspace_id)
    .single()

  // Fetch conversation messages
  const { data: messages } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20)

  // Generate AI summary
  let summary = "Escalation requires founder review."
  let context = ""

  if (messages && messages.length > 0) {
    context = messages
      .slice(-5)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n\n")

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      try {
        const anthropic = new Anthropic({ apiKey })

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 300,
          system:
            "Summarize this conversation between a team member and their AI coach. Focus on: 1) What decision or issue needs the founder's input. 2) Key context. 3) What the team member has already considered. Keep it under 150 words.",
          messages: [
            {
              role: "user",
              content: messages
                .map((m) => `${m.role}: ${m.content}`)
                .join("\n\n"),
            },
          ],
        })

        summary =
          response.content[0].type === "text" ? response.content[0].text : summary
      } catch {
        // Keep default summary
      }
    }
  }

  // Create escalation
  const { error: insertError } = await supabase.from("escalations").insert({
    conversation_id: conversationId,
    member_id: member.id,
    workspace_id: member.workspace_id,
    summary,
    context,
    status: "pending",
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Update conversation status
  await supabase
    .from("conversations")
    .update({ status: "escalated" })
    .eq("id", conversationId)

  return NextResponse.json({ success: true })
}
