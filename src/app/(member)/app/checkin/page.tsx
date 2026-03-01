"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ClipboardCheck, Loader2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CheckinData {
  id: string
  date: string
  working_on: string
  blockers: string | null
  ai_guidance: string | null
  founder_notes: string | null
}

export default function CheckinPage() {
  const [workingOn, setWorkingOn] = useState("")
  const [blockers, setBlockers] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guidance, setGuidance] = useState<string | null>(null)
  const [existingCheckin, setExistingCheckin] = useState<CheckinData | null>(null)
  const [pastCheckins, setPastCheckins] = useState<CheckinData[]>([])
  const [checking, setChecking] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    async function loadCheckins() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from("team_members")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!member) return

      const today = new Date().toISOString().split("T")[0]

      // Fetch today's check-in + last 7 days in parallel
      const [todayRes, historyRes] = await Promise.all([
        supabase
          .from("daily_checkins")
          .select("id, date, working_on, blockers, ai_guidance, founder_notes")
          .eq("member_id", member.id)
          .eq("date", today)
          .maybeSingle(),
        supabase
          .from("daily_checkins")
          .select("id, date, working_on, blockers, ai_guidance, founder_notes")
          .eq("member_id", member.id)
          .neq("date", today)
          .order("date", { ascending: false })
          .limit(7),
      ])

      if (todayRes.data) setExistingCheckin(todayRes.data)
      if (historyRes.data) setPastCheckins(historyRes.data)
      setChecking(false)
    }
    loadCheckins()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workingOn, blockers }),
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setGuidance(data.aiGuidance)
        setExistingCheckin({
          id: data.id || "",
          date: new Date().toISOString().split("T")[0],
          working_on: workingOn,
          blockers: blockers || null,
          ai_guidance: data.aiGuidance,
          founder_notes: null,
        })
      }
    } catch {
      setError("Failed to submit check-in")
    }

    setLoading(false)
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00")
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Today's check-in */}
        {existingCheckin ? (
          <>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Today&apos;s Check-in
            </h2>

            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Working on</p>
                <p className="text-sm whitespace-pre-wrap">{existingCheckin.working_on}</p>
              </div>

              {existingCheckin.blockers && (
                <div>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Blockers</p>
                  <p className="text-sm whitespace-pre-wrap">{existingCheckin.blockers}</p>
                </div>
              )}
            </div>

            {(existingCheckin.ai_guidance || guidance) && (
              <div className="rounded-lg border border-border/50 bg-muted/50 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">AI Guidance</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {guidance || existingCheckin.ai_guidance}
                </p>
              </div>
            )}

            {existingCheckin.founder_notes && (
              <div className="rounded-lg border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Founder Feedback</p>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {existingCheckin.founder_notes}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Check-in submitted for today. Come back tomorrow.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Daily Check-in
            </h2>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">What are you working on today?</CardTitle>
                <CardDescription>
                  Share your focus for today. Your AI coach will provide guidance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="working_on">Working on</Label>
                    <Textarea
                      id="working_on"
                      value={workingOn}
                      onChange={(e) => setWorkingOn(e.target.value)}
                      placeholder="What are you focused on today?"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blockers">Blockers (optional)</Label>
                    <Textarea
                      id="blockers"
                      value={blockers}
                      onChange={(e) => setBlockers(e.target.value)}
                      placeholder="Anything blocking your progress?"
                      rows={2}
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Check-in"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        {/* Past check-ins with founder feedback */}
        {pastCheckins.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Recent check-ins ({pastCheckins.length})
            </button>

            {showHistory && (
              <div className="mt-3 space-y-3">
                {pastCheckins.map((ci) => (
                  <div key={ci.id} className="rounded-lg border p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{formatDate(ci.date)}</p>
                    <p className="text-sm">{ci.working_on}</p>

                    {ci.blockers && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Blockers: {ci.blockers}
                      </p>
                    )}

                    {ci.founder_notes && (
                      <div className="mt-2 rounded-md border-l-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 pl-3 py-2">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Founder Feedback</p>
                        <p className="text-sm">{ci.founder_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
