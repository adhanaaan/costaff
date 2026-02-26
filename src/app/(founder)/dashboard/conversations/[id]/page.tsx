import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ConversationViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch conversation with member info
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*, team_members(name, role_title)")
    .eq("id", id)
    .single()

  if (!conversation) redirect("/dashboard")

  // Fetch all messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  return (
    <div className="max-w-4xl">
      <Link href="/dashboard">
        <Button variant="ghost" className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {conversation.title || "Conversation"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {conversation.team_members?.name} · {conversation.team_members?.role_title}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{conversation.conversation_type}</Badge>
              {conversation.status === "escalated" && (
                <Badge variant="destructive">Escalated</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages && messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : msg.role === "system"
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-center italic"
                          : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <p className="text-[10px] mt-1 opacity-60">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages in this conversation.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
