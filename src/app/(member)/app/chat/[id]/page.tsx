import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatInterface } from "@/components/chat/chat-interface"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch messages for this conversation
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  return (
    <ChatInterface
      conversationId={id}
      initialMessages={
        messages?.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })) || []
      }
    />
  )
}
