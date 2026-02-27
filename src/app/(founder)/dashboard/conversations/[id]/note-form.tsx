"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { addConversationNote } from "@/app/(founder)/dashboard/actions"
import { useRouter } from "next/navigation"

export function ConversationNoteForm({ conversationId }: { conversationId: string }) {
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const router = useRouter()

  async function handleSend() {
    if (!note.trim() || sending) return
    setSending(true)

    const result = await addConversationNote(conversationId, note.trim())
    if (!result.error) {
      setNote("")
      router.refresh()
    }

    setSending(false)
  }

  return (
    <div className="border-t pt-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Leave a note for this team member
      </p>
      <div className="flex gap-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Type your feedback or guidance..."
          rows={2}
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button
          onClick={handleSend}
          disabled={!note.trim() || sending}
          size="icon"
          className="shrink-0 self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        This will appear in their conversation as a founder note.
      </p>
    </div>
  )
}
