import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TeamManager } from "./team-manager"

export default async function TeamPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("founder_id", user.id)
    .single()

  if (!workspace) redirect("/login")

  const { data: members } = await supabase
    .from("team_members")
    .select("*, role_configs(*)")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })

  const { data: roles } = await supabase
    .from("role_configs")
    .select("id, title")
    .eq("workspace_id", workspace.id)

  return (
    <div className="max-w-4xl">
      <h2 className="mb-6 text-2xl font-bold">Team Members</h2>
      <TeamManager
        members={members || []}
        roles={roles || []}
        workspaceId={workspace.id}
      />
    </div>
  )
}
