"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { RoleConfig } from "@/types/database"

export async function createRole(formData: FormData): Promise<{ error?: string; role?: RoleConfig }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const workspaceId = formData.get("workspace_id") as string

  const { data: role, error } = await supabase
    .from("role_configs")
    .insert({
      workspace_id: workspaceId,
      title: formData.get("title") as string,
      success_metrics: (formData.get("success_metrics") as string) || null,
      decision_boundaries: (formData.get("decision_boundaries") as string) || null,
      frameworks: (formData.get("frameworks") as string) || null,
      context_prompt: (formData.get("context_prompt") as string) || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath("/dashboard/roles")
  return { role: role as RoleConfig }
}

export async function updateRole(
  roleId: string,
  formData: FormData
): Promise<{ error?: string; role?: RoleConfig }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { data: role, error } = await supabase
    .from("role_configs")
    .update({
      title: formData.get("title") as string,
      success_metrics: (formData.get("success_metrics") as string) || null,
      decision_boundaries: (formData.get("decision_boundaries") as string) || null,
      frameworks: (formData.get("frameworks") as string) || null,
      context_prompt: (formData.get("context_prompt") as string) || null,
    })
    .eq("id", roleId)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath("/dashboard/roles")
  return { role: role as RoleConfig }
}

export async function deleteRole(roleId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { error } = await supabase.from("role_configs").delete().eq("id", roleId)
  if (error) return { error: error.message }

  revalidatePath("/dashboard/roles")
  return { success: true }
}
