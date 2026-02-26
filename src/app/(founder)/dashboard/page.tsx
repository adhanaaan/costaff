import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EscalationQueue } from "@/components/dashboard/escalation-queue"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { CheckinSummary } from "@/components/dashboard/checkin-summary"
import { MemberStats } from "@/components/dashboard/member-stats"

export default async function DashboardPage() {
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

  const today = new Date().toISOString().split("T")[0]

  // Fetch all dashboard data in parallel
  const [escalationsRes, checkinsRes, membersRes, conversationsRes] =
    await Promise.all([
      supabase
        .from("escalations")
        .select("*, team_members(name, role_title)")
        .eq("workspace_id", workspace.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("daily_checkins")
        .select("*, team_members(name, role_title)")
        .eq("workspace_id", workspace.id)
        .eq("date", today)
        .order("created_at", { ascending: false }),
      supabase
        .from("team_members")
        .select("*")
        .eq("workspace_id", workspace.id)
        .eq("status", "active"),
      supabase
        .from("conversations")
        .select("*, team_members(name, role_title)")
        .eq("workspace_id", workspace.id)
        .order("updated_at", { ascending: false })
        .limit(20),
    ])

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* Member stats */}
      <MemberStats members={membersRes.data || []} />

      {/* Escalation queue */}
      <EscalationQueue escalations={escalationsRes.data || []} />

      {/* Check-in summary */}
      <CheckinSummary checkins={checkinsRes.data || []} />

      {/* Activity feed */}
      <ActivityFeed conversations={conversationsRes.data || []} />
    </div>
  )
}
