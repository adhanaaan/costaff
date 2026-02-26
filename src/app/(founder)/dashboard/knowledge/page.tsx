import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { KnowledgeBase } from "./knowledge-base"

export default async function KnowledgePage() {
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

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-4xl">
      <h2 className="mb-6 text-2xl font-bold">Knowledge Base</h2>
      <KnowledgeBase documents={documents || []} workspaceId={workspace.id} />
    </div>
  )
}
