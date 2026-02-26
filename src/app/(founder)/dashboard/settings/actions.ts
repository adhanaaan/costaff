"use server"

import { createClient } from "@/lib/supabase/server"
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

  const { error } = await supabase
    .from("workspaces")
    .update(updates)
    .eq("founder_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/settings")
  return { success: true }
}
