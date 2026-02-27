"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/(auth)/actions"
import { cn } from "@/lib/utils"
import type { Workspace } from "@/types/database"
import { useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/roles", label: "Roles", icon: Shield },
  { href: "/dashboard/knowledge", label: "Knowledge Base", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

interface DashboardSidebarProps {
  workspace: Workspace
  userEmail: string
}

export function DashboardSidebar({ workspace, userEmail }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar text-sidebar-foreground transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo / workspace name */}
        <div className="flex h-14 items-center gap-2 px-5">
          <span className="text-base font-semibold tracking-tight text-white">CoStaff</span>
          <span className="text-xs text-slate-400 truncate">{workspace.name}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 pt-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-muted text-white"
                    : "text-slate-400 hover:bg-sidebar-muted/50 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-slate-700/50 p-4">
          <p className="mb-2 truncate text-xs text-slate-500">{userEmail}</p>
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

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
