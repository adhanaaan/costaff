"use client"

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, AlertTriangle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatInterfaceProps {
  conversationId: string | null
  initialMessages: Message[]
}

let msgIdCounter = 0
function nextMsgId() {
  return `msg-${Date.now()}-${++msgIdCounter}`
}

const ChatBubble = memo(function ChatBubble({
  msg,
  isLastAssistant,
  isStreaming,
}: {
  msg: Message
  isLastAssistant: boolean
  isStreaming: boolean
}) {
  return (
    <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
          msg.role === "user"
            ? "bg-primary text-primary-foreground"
            : msg.role === "system"
              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 text-center italic"
              : "bg-muted"
        }`}
      >
        <div className="whitespace-pre-wrap">{msg.content}</div>
        {isStreaming && isLastAssistant && (
          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
        )}
      </div>
    </div>
  )
})

export function ChatInterface({ conversationId: initialConvId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const streamingIdRef = useRef<string | null>(null)
  const [convId, setConvId] = useState<string | null>(initialConvId)
  const [error, setError] = useState<string | null>(null)
  const [escalateOpen, setEscalateOpen] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  async function handleSend() {
    if (!input.trim() || isStreaming) return

    const userMessage = input.trim()
    setInput("")
    setError(null)

    const userMsgId = nextMsgId()
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: userMessage }])
    setIsStreaming(true)
    setStreamingContent("")
    streamingIdRef.current = nextMsgId()

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId: convId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Request failed")
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)

        // Check for conversation ID marker
        if (chunk.includes("__CONV_ID__:")) {
          const [text, idPart] = chunk.split("__CONV_ID__:")
          assistantMessage += text
          const newConvId = idPart.trim()
          setConvId(newConvId)
          // Update URL for new conversations
          if (!initialConvId) {
            router.replace(`/app/chat/${newConvId}`)
          }
        } else {
          assistantMessage += chunk
        }

        // Only update streaming content state (not the messages array)
        setStreamingContent(assistantMessage)
      }

      // Streaming done — commit final message to the messages array
      const finalId = streamingIdRef.current!
      setMessages((prev) => [...prev, { id: finalId, role: "assistant", content: assistantMessage }])
      setStreamingContent("")
      streamingIdRef.current = null
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
      setStreamingContent("")
      streamingIdRef.current = null
    }

    setIsStreaming(false)
    inputRef.current?.focus()
  }

  async function handleEscalate() {
    if (!convId) return
    setEscalating(true)

    try {
      const res = await fetch("/api/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Escalation failed")
      }

      setEscalateOpen(false)
      // Add system message about escalation
      setMessages((prev) => [
        ...prev,
        {
          id: nextMsgId(),
          role: "system",
          content: "This conversation has been escalated to the founder for review.",
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Escalation failed")
    }

    setEscalating(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-medium">
          {convId ? "Chat" : "New Conversation"}
        </h2>
        {convId && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-orange-600"
            onClick={() => setEscalateOpen(true)}
          >
            <AlertTriangle className="h-3 w-3" />
            Escalate
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <p className="text-lg font-medium mb-2">Welcome to CoStaff</p>
              <p className="text-sm">Ask a question to get started. Your AI coach is ready to help.</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            msg={msg}
            isLastAssistant={false}
            isStreaming={false}
          />
        ))}
        {/* Streaming message rendered separately — only this div re-renders on each chunk */}
        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm bg-muted">
              <div className="whitespace-pre-wrap">{streamingContent}</div>
              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={isStreaming}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Escalation dialog */}
      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent onClose={() => setEscalateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Escalate to Founder</DialogTitle>
            <DialogDescription>
              This will flag this conversation for the founder&apos;s review.
              An AI summary will be generated to help them understand the context.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEscalate} disabled={escalating} className="gap-1">
              {escalating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {escalating ? "Escalating..." : "Escalate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
