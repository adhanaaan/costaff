import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/encryption"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { workingOn, blockers } = await req.json()

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

  if (!workspace?.anthropic_api_key_encrypted) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 400 }
    )
  }

  // Generate AI guidance
  let aiGuidance = ""
  try {
    const apiKey = decrypt(workspace.anthropic_api_key_encrypted)
    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 500,
      system: `You are an AI Chief of Staff for ${workspace.name}. A team member (${member.role_title}) is checking in for the day. Give brief, actionable guidance based on what they're working on and any blockers. Be encouraging but push for high-agency behavior. Keep response under 200 words.`,
      messages: [
        {
          role: "user",
          content: `Working on: ${workingOn}\n${blockers ? `Blockers: ${blockers}` : "No blockers reported."}`,
        },
      ],
    })

    aiGuidance =
      response.content[0].type === "text" ? response.content[0].text : ""
  } catch {
    aiGuidance = "Unable to generate guidance at this time."
  }

  // Save check-in
  const { error: insertError } = await supabase.from("daily_checkins").insert({
    workspace_id: member.workspace_id,
    member_id: member.id,
    working_on: workingOn,
    blockers: blockers || null,
    ai_guidance: aiGuidance,
  })

  if (insertError) {
    // Might be duplicate for today
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "You've already submitted a check-in for today" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ aiGuidance })
}
