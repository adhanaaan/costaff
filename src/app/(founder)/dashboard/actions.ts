"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function respondToEscalation(escalationId: string, response: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // Update escalation
  const { data: escalation, error: updateError } = await supabase
    .from("escalations")
    .update({
      founder_response: response,
      status: "resolved",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", escalationId)
    .select("conversation_id")
    .single()

  if (updateError) return { error: updateError.message }

  // Inject founder response as system message
  if (escalation?.conversation_id) {
    await supabase.from("messages").insert({
      conversation_id: escalation.conversation_id,
      role: "system",
      content: `[Founder Response]: ${response}`,
      metadata: { type: "founder_response", escalation_id: escalationId },
    })

    // Update conversation status back to active
    await supabase
      .from("conversations")
      .update({ status: "active" })
      .eq("id", escalation.conversation_id)
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function addFounderNote(checkinId: string, note: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from("daily_checkins")
    .update({ founder_notes: note })
    .eq("id", checkinId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}
