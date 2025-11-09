import { ShieldIcon, RocketIcon, AlertCircleIcon, CheckIcon, RotateCcwIcon, TargetIcon } from "lucide-react"

export function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">How It Works</h2>
          <p className="mt-4 text-lg text-muted-foreground">Two powerful features, one simple extension</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Feature 1: Protect */}
          <div className="rounded-xl border border-border bg-card p-8 hover:border-primary/50 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 mb-4">
              <ShieldIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Never Leak Sensitive Data Again</h3>
            <p className="mt-2 text-muted-foreground">
              Prompt Protekt works silently in the background. As you type, it scans for Personally Identifiable
              Information (PII) just like Grammarly checks for spelling.
            </p>

            <ul className="mt-6 space-y-3">
              <li className="flex gap-3">
                <AlertCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-sm text-foreground">
                  <strong>Real-time Alerts:</strong> A small icon appears when sensitive data like names, emails, phone
                  numbers, or SSNs are detected.
                </span>
              </li>
              <li className="flex gap-3">
                <CheckIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-sm text-foreground">
                  <strong>One-Click Anonymization:</strong> Click the alert to see all detected items.
                </span>
              </li>
              <li className="flex gap-3">
                <RotateCcwIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-sm text-foreground">
                  <strong>Review & Replace:</strong> Instantly replace all PII with safe, anonymous placeholders with a
                  single button.
                </span>
              </li>
            </ul>
          </div>

          {/* Feature 2: Enhance */}
          <div className="rounded-xl border border-border bg-card p-8 hover:border-accent/50 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20 mb-4">
              <RocketIcon className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Get Better AI Results, Instantly</h3>
            <p className="mt-2 text-muted-foreground">
              Stop wasting time with bad prompts. Our premium enhancement feature (available for logged-in users)
              optimizes your queries with one click.
            </p>

            <ul className="mt-6 space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-accent font-bold">$</span>
                <span className="text-sm text-foreground">
                  <strong>Token Saver:</strong> Our AI condenses your prompt to be more concise, saving you tokens and
                  money.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 text-accent font-bold">⚡</span>
                <span className="text-sm text-foreground">
                  <strong>Advanced Enhancement:</strong> Applies prompt engineering techniques to make your request
                  clearer and more effective.
                </span>
              </li>
              <li className="flex gap-3">
                <TargetIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                <span className="text-sm text-foreground">
                  <strong>Better Outputs:</strong> Get the answers you actually want from your AI.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
