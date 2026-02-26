"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardCheck } from "lucide-react"
import { addFounderNote } from "@/app/(founder)/dashboard/actions"

interface CheckinSummaryProps {
  checkins: Array<{
    id: string
    working_on: string | null
    blockers: string | null
    ai_guidance: string | null
    founder_notes: string | null
    team_members: { name: string; role_title: string } | null
  }>
}

export function CheckinSummary({ checkins }: CheckinSummaryProps) {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  async function handleSaveNote(checkinId: string) {
    const note = notes[checkinId]
    if (!note?.trim()) return

    await addFounderNote(checkinId, note)
    setSaved((prev) => ({ ...prev, [checkinId]: true }))
    setTimeout(() => setSaved((prev) => ({ ...prev, [checkinId]: false })), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Today&apos;s Check-ins
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checkins.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No check-ins submitted today yet.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {checkins.map((ci) => (
              <div key={ci.id} className="rounded-lg border p-4 space-y-2">
                <div>
                  <p className="font-medium text-sm">
                    {ci.team_members?.name || "Team Member"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ci.team_members?.role_title}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Working on:</span>{" "}
                  {ci.working_on}
                </div>
                {ci.blockers && (
                  <div className="text-sm text-orange-600 dark:text-orange-400">
                    <span className="font-medium">Blockers:</span> {ci.blockers}
                  </div>
                )}
                <div className="pt-2 border-t">
                  <Textarea
                    placeholder="Add a note..."
                    className="text-sm mb-2"
                    rows={1}
                    value={notes[ci.id] ?? ci.founder_notes ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [ci.id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveNote(ci.id)}
                  >
                    {saved[ci.id] ? "Saved!" : "Save Note"}
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
