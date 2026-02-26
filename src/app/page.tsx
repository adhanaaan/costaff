import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  MessageSquare,
  LayoutDashboard,
  Shield,
  Users,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react"

const features = [
  {
    icon: MessageSquare,
    title: "AI-Powered Coaching",
    description:
      "Team members chat with an AI coach that knows your company context, uses Socratic questioning, and applies decision frameworks.",
  },
  {
    icon: LayoutDashboard,
    title: "Founder Dashboard",
    description:
      "See what your team is working on, where they're stuck, and what decisions they've made — all without being in the loop.",
  },
  {
    icon: Shield,
    title: "Role-Aware Intelligence",
    description:
      "Configure expectations, frameworks, and decision boundaries per role. A BD intern gets different coaching than a video editor.",
  },
  {
    icon: ClipboardCheck,
    title: "Daily Check-ins",
    description:
      "Structured daily check-ins with AI guidance. Know what everyone is working on and where they're blocked.",
  },
  {
    icon: AlertTriangle,
    title: "Smart Escalations",
    description:
      "Team members escalate decisions when needed. AI summarizes the context so you can respond fast.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Invite team members, assign roles, and manage your workspace. All with simple invite links.",
  },
]

const steps = [
  {
    step: "1",
    title: "Create Your Workspace",
    description: "Sign up, name your workspace, and add your Anthropic API key.",
  },
  {
    step: "2",
    title: "Configure & Upload",
    description:
      "Upload company docs, configure roles with expectations and frameworks.",
  },
  {
    step: "3",
    title: "Invite Your Team",
    description:
      "Generate invite links for team members. They sign up and start chatting.",
  },
  {
    step: "4",
    title: "Monitor & Guide",
    description:
      "View activity, respond to escalations, and add async notes — all from your dashboard.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <h1 className="text-xl font-bold">CoStaff</h1>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Your AI Chief of Staff
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Configure an AI coach with your company context so your team can
          ideate, iterate, and execute autonomously — while you maintain
          visibility without being in the loop.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/signup">
            <Button size="lg">Start Building Your Team</Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg">
              See How It Works
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <h3 className="mb-10 text-center text-2xl font-bold">
          Everything Your Team Needs
        </h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-6">
                <feature.icon className="mb-3 h-8 w-8 text-primary" />
                <h4 className="mb-2 font-semibold">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h3 className="mb-10 text-center text-2xl font-bold">
            How It Works
          </h3>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                  {s.step}
                </div>
                <h4 className="mb-2 font-semibold">{s.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h3 className="text-3xl font-bold">Ready to empower your team?</h3>
        <p className="mt-4 text-muted-foreground">
          Set up in minutes. Bring your own Anthropic API key.
        </p>
        <div className="mt-8">
          <Link href="/signup">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>CoStaff — AI Chief of Staff for Modern Teams</p>
      </footer>
    </div>
  )
}
