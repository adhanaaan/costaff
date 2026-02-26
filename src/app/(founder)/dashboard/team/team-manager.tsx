"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Copy, UserMinus, Users } from "lucide-react"
import { addTeamMember, deactivateMember } from "./actions"
import type { TeamMember } from "@/types/database"

interface TeamManagerProps {
  members: TeamMember[]
  roles: { id: string; title: string }[]
  workspaceId: string
}

export function TeamManager({ members: initialMembers, roles, workspaceId }: TeamManagerProps) {
  const [members, setMembers] = useState(initialMembers)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleAdd(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.append("workspace_id", workspaceId)

    const result = await addTeamMember(formData)
    if (result.error) {
      setError(result.error)
    } else {
      setInviteLink(result.inviteLink || null)
      if (result.member) {
        setMembers((prev) => [result.member!, ...prev])
      }
    }
    setLoading(false)
  }

  async function handleDeactivate(memberId: string) {
    const result = await deactivateMember(memberId)
    if (result.error) {
      setError(result.error)
    } else {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: "deactivated" as const } : m))
      )
    }
  }

  function copyLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <Button onClick={() => { setDialogOpen(true); setInviteLink(null); setError(null) }} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Team Member
      </Button>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <Users className="h-8 w-8" />
            <p className="text-sm">No team members yet. Add someone to get started.</p>
          </div>
        ) : (
          members.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.email} · {member.role_title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      member.status === "active"
                        ? "default"
                        : member.status === "invited"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {member.status}
                  </Badge>
                  {member.status !== "deactivated" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeactivate(member.id)}
                      title="Deactivate member"
                    >
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>

          {inviteLink ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this invite link with the team member:
              </p>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="text-xs" />
                <Button variant="outline" onClick={copyLink} className="gap-1 shrink-0">
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => setDialogOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form action={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role_title">Role Title</Label>
                <Input
                  id="role_title"
                  name="role_title"
                  placeholder="e.g., BD Intern"
                  required
                />
              </div>
              {roles.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="role_config_id">Role Configuration (optional)</Label>
                  <Select id="role_config_id" name="role_config_id">
                    <option value="">No role config</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add & Generate Invite"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
