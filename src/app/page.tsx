import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-semibold tracking-tight">CoStaff</span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pt-24 pb-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight leading-[1.15] sm:text-5xl">
              Stop being the bottleneck for your own team.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
              CoStaff gives your team an AI coach that knows your company inside
              out. They get instant guidance. You get visibility without the
              back-and-forth.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start for free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* What it actually does — no feature card grid */}
        <section className="border-t bg-card">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <p className="text-sm font-medium text-accent uppercase tracking-wider mb-8">How it works</p>
            <div className="grid gap-12 md:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold mb-3">You set the context.</p>
                <p className="text-muted-foreground leading-relaxed">
                  Upload your docs, define roles, set decision boundaries and
                  frameworks. The AI learns how your company thinks.
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold mb-3">Your team gets coached.</p>
                <p className="text-muted-foreground leading-relaxed">
                  Team members chat with an AI that asks the right questions,
                  pushes their thinking, and knows what &quot;good&quot; looks
                  like for their role.
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold mb-3">You stay in the loop.</p>
                <p className="text-muted-foreground leading-relaxed">
                  See daily check-ins, review escalations, and drop in notes —
                  without sitting in every meeting or Slack thread.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof / differentiator */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-2xl font-semibold leading-snug mb-4">
              Built for founders who manage small teams and wear too many hats.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Not another chatbot. CoStaff is role-aware — a BD intern gets
              different coaching than a video editor. It uses Socratic
              questioning to build your team&apos;s judgment, not just give them
              answers. And when something needs your input, it escalates with
              full context so you can respond in 30 seconds.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t">
          <div className="mx-auto max-w-5xl px-6 py-16 flex items-center justify-between flex-wrap gap-6">
            <div>
              <p className="text-xl font-semibold">Ready to try it?</p>
              <p className="text-muted-foreground mt-1">Free to set up. Bring your own Anthropic key.</p>
            </div>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        CoStaff
      </footer>
    </div>
  )
}
