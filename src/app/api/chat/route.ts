import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/encryption"
import { buildSystemPrompt } from "@/lib/ai/system-prompt"
import { getRelevantDocumentContext } from "@/lib/ai/context"
import { NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { message, conversationId } = await req.json()

  // Look up team member with role config
  const { data: member } = await supabase
    .from("team_members")
    .select("*, role_configs(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!member) {
    return NextResponse.json({ error: "Not a team member" }, { status: 403 })
  }

  // Get workspace with encrypted API key
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", member.workspace_id)
    .single()

  if (!workspace?.anthropic_api_key_encrypted) {
    return NextResponse.json(
      { error: "API key not configured. Ask your founder to set it up." },
      { status: 400 }
    )
  }

  // Decrypt API key
  let apiKey: string
  try {
    apiKey = decrypt(workspace.anthropic_api_key_encrypted)
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt API key" },
      { status: 500 }
    )
  }

  // Get or create conversation
  let convId = conversationId
  if (!convId) {
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({
        workspace_id: workspace.id,
        member_id: member.id,
        title: message.slice(0, 50),
        conversation_type: "chat",
      })
      .select()
      .single()

    if (convError) {
      return NextResponse.json({ error: convError.message }, { status: 500 })
    }
    convId = conv.id
  }

  // Save user message
  await supabase.from("messages").insert({
    conversation_id: convId,
    role: "user",
    content: message,
  })

  // Fetch last 20 messages for history
  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true })
    .limit(20)

  // Get documents for context
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspace.id)

  const documentContext = getRelevantDocumentContext(documents || [], message)

  // Build system prompt
  const systemPrompt = buildSystemPrompt({
    workspaceName: workspace.name,
    coachingStyle: workspace.coaching_style || "socratic",
    customInstructions: workspace.custom_instructions,
    memberRoleTitle: member.role_title,
    roleConfig: member.role_configs || null,
    documentContext,
  })

  // Create Anthropic client with founder's API key
  const anthropic = new Anthropic({ apiKey })

  // Build messages array
  const claudeMessages = (history || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

  // Stream response
  let fullResponse = ""

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages,
    })

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        stream.on("text", (text) => {
          fullResponse += text
          controller.enqueue(encoder.encode(text))
        })

        stream.on("end", async () => {
          // Save assistant message
          await supabase.from("messages").insert({
            conversation_id: convId,
            role: "assistant",
            content: fullResponse,
          })

          // Update conversation timestamp
          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", convId)

          // Send conversation ID marker
          controller.enqueue(encoder.encode(`\n__CONV_ID__:${convId}`))
          controller.close()
        })

        stream.on("error", (err) => {
          controller.error(err)
        })
      },
    })

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-Id": convId,
      },
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "AI request failed"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
