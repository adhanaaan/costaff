"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Shield, Plus, Trash2, Edit } from "lucide-react"
import { createRole, updateRole, deleteRole } from "./actions"
import type { RoleConfig } from "@/types/database"

const FRAMEWORK_TEMPLATES = [
  { name: "Musk 5-Step", value: "1. Question the requirement\n2. Delete unnecessary steps\n3. Simplify what remains\n4. Accelerate cycle time\n5. Automate (only after 1-4)" },
  { name: "First Principles", value: "Break down to fundamental truths, then reason up from there" },
  { name: "BANT (BD)", value: "Budget: Can they afford it?\nAuthority: Are they the decision maker?\nNeed: Do they have a genuine need?\nTimeline: When do they need it?" },
  { name: "Eisenhower Matrix", value: "Urgent+Important: Do first\nImportant+Not Urgent: Schedule\nUrgent+Not Important: Delegate\nNot Urgent+Not Important: Eliminate" },
]

interface RolesManagerProps {
  roles: RoleConfig[]
  workspaceId: string
}

export function RolesManager({ roles: initialRoles, workspaceId }: RolesManagerProps) {
  const [roles, setRoles] = useState(initialRoles)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditingRole(null)
    setDialogOpen(true)
  }

  function openEdit(role: RoleConfig) {
    setEditingRole(role)
    setDialogOpen(true)
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.append("workspace_id", workspaceId)

    if (editingRole) {
      const result = await updateRole(editingRole.id, formData)
      if (result.error) {
        setError(result.error)
      } else if (result.role) {
        setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? result.role! : r)))
        setDialogOpen(false)
      }
    } else {
      const result = await createRole(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.role) {
        setRoles((prev) => [result.role!, ...prev])
        setDialogOpen(false)
      }
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const result = await deleteRole(id)
    if (result.error) {
      setError(result.error)
    } else {
      setRoles((prev) => prev.filter((r) => r.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <Button onClick={openCreate} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Role
      </Button>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {roles.length === 0 ? (
          <p className="col-span-2 text-center text-sm text-muted-foreground py-8">
            No roles configured yet. Create roles to define expectations for your team.
          </p>
        ) : (
          roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {role.title}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(role)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(role.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {role.success_metrics && (
                  <div>
                    <span className="font-medium text-muted-foreground">Metrics:</span>{" "}
                    {role.success_metrics.slice(0, 100)}
                  </div>
                )}
                {role.decision_boundaries && (
                  <div>
                    <span className="font-medium text-muted-foreground">Boundaries:</span>{" "}
                    {role.decision_boundaries.slice(0, 100)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Role Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={editingRole?.title || ""}
                placeholder="e.g., BD Intern, Video Editor"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="success_metrics">Success Metrics</Label>
              <Textarea
                id="success_metrics"
                name="success_metrics"
                defaultValue={editingRole?.success_metrics || ""}
                placeholder="What does good look like for this role?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decision_boundaries">Decision Boundaries</Label>
              <Textarea
                id="decision_boundaries"
                name="decision_boundaries"
                defaultValue={editingRole?.decision_boundaries || ""}
                placeholder="What can they decide vs. escalate?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frameworks">Frameworks</Label>
              <div className="mb-2 flex flex-wrap gap-1">
                {FRAMEWORK_TEMPLATES.map((fw) => (
                  <Button
                    key={fw.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const el = document.getElementById("frameworks") as HTMLTextAreaElement
                      if (el) {
                        el.value = el.value ? el.value + "\n\n" + fw.value : fw.value
                      }
                    }}
                  >
                    {fw.name}
                  </Button>
                ))}
              </div>
              <Textarea
                id="frameworks"
                name="frameworks"
                defaultValue={editingRole?.frameworks || ""}
                placeholder="Decision frameworks for this role"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="context_prompt">Additional Context Prompt</Label>
              <Textarea
                id="context_prompt"
                name="context_prompt"
                defaultValue={editingRole?.context_prompt || ""}
                placeholder="Role-specific instructions for the AI"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingRole ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
