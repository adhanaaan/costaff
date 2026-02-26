"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { joinWithToken } from "../../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function JoinPage() {
  const params = useParams()
  const token = params.token as string
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [memberInfo, setMemberInfo] = useState<{
    name: string
    role_title: string
    email: string
  } | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkToken() {
      const supabase = createClient()
      const { data } = await supabase
        .from("team_members")
        .select("name, role_title, email")
        .eq("invite_token", token)
        .eq("status", "invited")
        .maybeSingle()

      if (data) {
        setMemberInfo(data)
      } else {
        setError("Invalid or expired invite link")
      }
      setChecking(false)
    }
    checkToken()
  }, [token])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await joinWithToken(token, formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Verifying invite link...
        </CardContent>
      </Card>
    )
  }

  if (!memberInfo) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          {error || "Invalid invite link"}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Join Your Team</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join as <strong>{memberInfo.role_title}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label>Name</Label>
            <p className="text-sm text-muted-foreground">{memberInfo.name}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={memberInfo.email}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Joining..." : "Join Team"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
