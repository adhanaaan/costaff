import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import type { Workspace } from "@/types/database"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Check if user is a founder
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("founder_id", user.id)
    .maybeSingle()

  if (!workspace) {
    // Not a founder, check if team member
    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (member) redirect("/app")
    redirect("/login")
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar workspace={workspace as Workspace} userEmail={user.email || ""} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
