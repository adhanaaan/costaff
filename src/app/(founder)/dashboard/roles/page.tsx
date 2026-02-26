import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RolesManager } from "./roles-manager"

export default async function RolesPage() {
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

  const { data: roles } = await supabase
    .from("role_configs")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-4xl">
      <h2 className="mb-6 text-2xl font-bold">Role Configuration</h2>
      <RolesManager roles={roles || []} workspaceId={workspace.id} />
    </div>
  )
}
