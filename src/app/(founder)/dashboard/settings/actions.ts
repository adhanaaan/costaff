"use server"

import { createClient } from "@/lib/supabase/server"
import { encrypt } from "@/lib/encryption"
import { revalidatePath } from "next/cache"

export async function updateSettings(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const updates: Record<string, unknown> = {
    name: formData.get("name"),
    coaching_style: formData.get("coaching_style"),
    custom_instructions: formData.get("custom_instructions") || null,
  }

  const apiKey = formData.get("api_key") as string
  if (apiKey && apiKey.trim()) {
    updates.anthropic_api_key_encrypted = encrypt(apiKey.trim())
  }

  const { error } = await supabase
    .from("workspaces")
    .update(updates)
    .eq("founder_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/settings")
  return { success: true }
}
