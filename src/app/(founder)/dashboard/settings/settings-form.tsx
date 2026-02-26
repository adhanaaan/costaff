"use client"

import { useState } from "react"
import { updateSettings } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface SettingsFormProps {
  workspace: {
    name: string
    coaching_style: string
    custom_instructions: string
  }
}

export function SettingsForm({ workspace }: SettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage(null)
    const result = await updateSettings(formData)
    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Settings saved successfully" })
    }
    setLoading(false)
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Configure your workspace settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input id="name" name="name" defaultValue={workspace.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coaching_style">Coaching Style</Label>
            <Select
              id="coaching_style"
              name="coaching_style"
              defaultValue={workspace.coaching_style}
            >
              <option value="socratic">Socratic (asks questions to guide thinking)</option>
              <option value="direct">Direct (gives clear answers)</option>
              <option value="balanced">Balanced (mix of both)</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom_instructions">Custom Instructions</Label>
            <Textarea
              id="custom_instructions"
              name="custom_instructions"
              defaultValue={workspace.custom_instructions}
              placeholder="Add any custom coaching rules or instructions..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  )
}
