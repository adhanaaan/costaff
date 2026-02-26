"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  })

  if (error) {
    return { error: error.message }
  }

  // Determine where to redirect based on role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Authentication failed" }

  // Check if user is a founder
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("founder_id", user.id)
    .maybeSingle()

  if (workspace) {
    redirect("/dashboard")
  }

  // Check if user is a team member
  const { data: member } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (member) {
    redirect("/app")
  }

  return { error: "No workspace or team membership found" }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const workspaceName = formData.get("workspace_name") as string

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: "Failed to create account" }
  }

  // Create workspace for the founder
  // Use admin client to bypass RLS for initial workspace creation
  const admin = createAdminClient()
  const { error: wsError } = await admin.from("workspaces").insert({
    name: workspaceName,
    founder_id: authData.user.id,
  })

  if (wsError) {
    return { error: "Failed to create workspace: " + wsError.message }
  }

  redirect("/dashboard/settings")
}

export async function joinWithToken(token: string, formData: FormData) {
  const admin = createAdminClient()

  // Look up the invite
  const { data: member, error: lookupError } = await admin
    .from("team_members")
    .select("*")
    .eq("invite_token", token)
    .eq("status", "invited")
    .maybeSingle()

  if (lookupError || !member) {
    return { error: "Invalid or expired invite link" }
  }

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Create auth user
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: "Failed to create account" }
  }

  // Link user to team member and activate
  const { error: updateError } = await admin
    .from("team_members")
    .update({
      user_id: authData.user.id,
      status: "active",
      invite_token: null,
    })
    .eq("id", member.id)

  if (updateError) {
    return { error: "Failed to activate membership: " + updateError.message }
  }

  redirect("/app")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
