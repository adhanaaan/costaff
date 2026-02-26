import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MemberSidebar } from "@/components/chat/member-sidebar"

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Check if user is a team member
  const { data: member } = await supabase
    .from("team_members")
    .select("*, role_configs(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (!member) {
    // Check if founder
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("founder_id", user.id)
      .maybeSingle()

    if (workspace) redirect("/dashboard")
    redirect("/login")
  }

  // Get conversations for sidebar
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("member_id", member.id)
    .order("updated_at", { ascending: false })
    .limit(50)

  return (
    <div className="flex h-screen">
      <MemberSidebar
        memberName={member.name}
        roleTitle={member.role_title}
        conversations={conversations || []}
      />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  )
}
