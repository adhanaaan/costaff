import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import Link from "next/link"

interface ActivityFeedProps {
  conversations: Array<{
    id: string
    title: string | null
    conversation_type: string
    status: string
    updated_at: string
    team_members: { name: string; role_title: string } | null
  }>
}

export function ActivityFeed({ conversations }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity yet. Conversations will appear here once your team starts chatting.
          </p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/dashboard/conversations/${conv.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">
                    {conv.team_members?.name || "Team Member"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {conv.title || "Untitled"} · {conv.team_members?.role_title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {conv.status === "escalated" && (
                    <Badge variant="destructive">Escalated</Badge>
                  )}
                  <Badge variant="secondary">{conv.conversation_type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
