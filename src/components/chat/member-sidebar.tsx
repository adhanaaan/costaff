"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, ClipboardCheck, LogOut, Plus, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { logout } from "@/app/(auth)/actions"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/types/database"
import { useState } from "react"

interface MemberSidebarProps {
  memberName: string
  roleTitle: string
  conversations: Conversation[]
}

export function MemberSidebar({ memberName, roleTitle, conversations }: MemberSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <h1 className="text-lg font-bold">CoStaff</h1>
        </div>

        <div className="border-b p-3">
          <p className="font-medium text-sm">{memberName}</p>
          <p className="text-xs text-muted-foreground">{roleTitle}</p>
        </div>

        <div className="p-3 space-y-1">
          <Link href="/app" onClick={() => setMobileOpen(false)}>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </Link>
          <Link href="/app/checkin" onClick={() => setMobileOpen(false)}>
            <Button
              variant={pathname === "/app/checkin" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
            >
              <ClipboardCheck className="h-4 w-4" />
              Daily Check-in
            </Button>
          </Link>
        </div>

        <nav className="flex-1 overflow-auto p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">Conversations</p>
          {conversations.map((conv) => {
            const isActive = pathname === `/app/chat/${conv.id}`
            return (
              <Link
                key={conv.id}
                href={`/app/chat/${conv.id}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <MessageSquare className="h-3 w-3 shrink-0" />
                <span className="truncate flex-1">{conv.title || "New Chat"}</span>
                {conv.status === "escalated" && (
                  <Badge variant="destructive" className="text-[10px] px-1">!</Badge>
                )}
              </Link>
            )
          })}
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No conversations yet
            </p>
          )}
        </nav>

        <div className="border-t p-3">
          <form action={logout}>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
