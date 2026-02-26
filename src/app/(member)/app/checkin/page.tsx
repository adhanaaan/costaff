"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ClipboardCheck, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function CheckinPage() {
  const [workingOn, setWorkingOn] = useState("")
  const [blockers, setBlockers] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guidance, setGuidance] = useState<string | null>(null)
  const [existingCheckin, setExistingCheckin] = useState<{
    working_on: string
    blockers: string | null
    ai_guidance: string | null
  } | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkExisting() {
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
      const { data: checkin } = await supabase
        .from("daily_checkins")
        .select("working_on, blockers, ai_guidance")
        .eq("member_id", member.id)
        .eq("date", today)
        .maybeSingle()

      if (checkin) {
        setExistingCheckin(checkin)
      }
      setChecking(false)
    }
    checkExisting()
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
          working_on: workingOn,
          blockers: blockers || null,
          ai_guidance: data.aiGuidance,
        })
      }
    } catch {
      setError("Failed to submit check-in")
    }

    setLoading(false)
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show existing check-in
  if (existingCheckin) {
    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6" />
            Today&apos;s Check-in
          </h2>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Working On</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{existingCheckin.working_on}</p>
            </CardContent>
          </Card>

          {existingCheckin.blockers && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Blockers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{existingCheckin.blockers}</p>
              </CardContent>
            </Card>
          )}

          {(existingCheckin.ai_guidance || guidance) && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">AI Guidance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {guidance || existingCheckin.ai_guidance}
                </p>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Check-in submitted for today. Come back tomorrow for your next check-in.
          </p>
        </div>
      </div>
    )
  }

  // Show check-in form
  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" />
          Daily Check-in
        </h2>

        <Card>
          <CardHeader>
            <CardTitle>What are you working on today?</CardTitle>
            <CardDescription>
              Share your focus for today. Your AI coach will provide guidance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="working_on">Working On</Label>
                <Textarea
                  id="working_on"
                  value={workingOn}
                  onChange={(e) => setWorkingOn(e.target.value)}
                  placeholder="Describe what you're focused on today..."
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
                  placeholder="Any blockers or challenges you're facing?"
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
      </div>
    </div>
  )
}
