"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MessageSquare } from "lucide-react"
import Link from "next/link"
import { respondToEscalation } from "@/app/(founder)/dashboard/actions"

interface EscalationQueueProps {
  escalations: Array<{
    id: string
    summary: string | null
    context: string | null
    status: string
    conversation_id: string
    created_at: string
    team_members: { name: string; role_title: string } | null
  }>
}

export function EscalationQueue({ escalations: initialEscalations }: EscalationQueueProps) {
  const [escalations, setEscalations] = useState(initialEscalations)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)

  async function handleRespond(id: string) {
    const response = responses[id]
    if (!response?.trim()) return

    setLoading(id)
    const result = await respondToEscalation(id, response)
    if (!result.error) {
      setEscalations((prev) => prev.filter((e) => e.id !== id))
    }
    setLoading(null)
  }

  async function handleDismiss(id: string) {
    setLoading(id)
    const result = await respondToEscalation(id, "[Dismissed]")
    if (!result.error) {
      setEscalations((prev) => prev.filter((e) => e.id !== id))
    }
    setLoading(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Escalation Queue
          {escalations.length > 0 && (
            <Badge variant="destructive">{escalations.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {escalations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending escalations. All clear!
          </p>
        ) : (
          <div className="space-y-4">
            {escalations.map((esc) => (
              <div key={esc.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {esc.team_members?.name || "Team Member"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {esc.team_members?.role_title} ·{" "}
                      {new Date(esc.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/dashboard/conversations/${esc.conversation_id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <MessageSquare className="h-3 w-3" />
                      View
                    </Button>
                  </Link>
                </div>
                <p className="text-sm">{esc.summary}</p>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Your response..."
                    className="text-sm"
                    rows={2}
                    value={responses[esc.id] || ""}
                    onChange={(e) =>
                      setResponses((prev) => ({
                        ...prev,
                        [esc.id]: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismiss(esc.id)}
                    disabled={loading === esc.id}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRespond(esc.id)}
                    disabled={loading === esc.id || !responses[esc.id]?.trim()}
                  >
                    Respond
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
