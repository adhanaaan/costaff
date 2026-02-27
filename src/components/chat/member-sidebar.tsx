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
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center px-5">
          <span className="text-base font-semibold tracking-tight text-white">CoStaff</span>
        </div>

        <div className="px-5 pb-3">
          <p className="font-medium text-sm text-white">{memberName}</p>
          <p className="text-xs text-slate-400">{roleTitle}</p>
        </div>

        <div className="px-3 space-y-0.5">
          <Link href="/app" onClick={() => setMobileOpen(false)}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-slate-300 hover:text-white hover:bg-sidebar-muted/50"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </Link>
          <Link href="/app/checkin" onClick={() => setMobileOpen(false)}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2",
                pathname === "/app/checkin"
                  ? "bg-sidebar-muted text-white"
                  : "text-slate-400 hover:text-white hover:bg-sidebar-muted/50"
              )}
            >
              <ClipboardCheck className="h-4 w-4" />
              Daily Check-in
            </Button>
          </Link>
        </div>

        <nav className="flex-1 overflow-auto px-3 pt-4 space-y-0.5">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2 px-3">
            Conversations
          </p>
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
                    ? "bg-sidebar-muted text-white"
                    : "text-slate-400 hover:bg-sidebar-muted/50 hover:text-slate-200"
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
            <p className="text-xs text-slate-500 text-center py-4">
              No conversations yet
            </p>
          )}
        </nav>

        <div className="border-t border-slate-700/50 p-4">
          <form action={logout}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-sidebar-muted/50"
            >
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
