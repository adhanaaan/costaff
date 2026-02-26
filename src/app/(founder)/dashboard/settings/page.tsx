import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("founder_id", user.id)
    .single()

  if (!workspace) redirect("/login")

  return (
    <div className="max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold">Workspace Settings</h2>
      <SettingsForm
        workspace={{
          name: workspace.name,
          coaching_style: workspace.coaching_style || "socratic",
          custom_instructions: workspace.custom_instructions || "",
        }}
      />
    </div>
  )
}
