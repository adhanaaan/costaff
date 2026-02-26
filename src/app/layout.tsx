import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CoStaff — AI Chief of Staff",
  description:
    "An AI Chief of Staff that founders configure with their company context, so their team can ideate, iterate, and execute autonomously.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
