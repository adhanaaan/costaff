"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import crypto from "crypto"
import type { TeamMember } from "@/types/database"

export async function addTeamMember(
  formData: FormData
): Promise<{ error?: string; inviteLink?: string; member?: TeamMember }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const workspaceId = formData.get("workspace_id") as string
  const inviteToken = crypto.randomUUID()

  const { data: member, error } = await supabase
    .from("team_members")
    .insert({
      workspace_id: workspaceId,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role_title: formData.get("role_title") as string,
      role_config_id: (formData.get("role_config_id") as string) || null,
      invite_token: inviteToken,
      status: "invited",
    })
    .select()
    .single()

  if (error) return { error: error.message }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const inviteLink = `${appUrl}/join/${inviteToken}`

  revalidatePath("/dashboard/team")
  return { inviteLink, member: member as TeamMember }
}

export async function deactivateMember(memberId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from("team_members")
    .update({ status: "deactivated" })
    .eq("id", memberId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/team")
  return { success: true }
}
