import { CheckIcon } from "lucide-react"

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Free to Protect. Power-Up to Enhance.</h2>
          <p className="mt-4 text-lg text-muted-foreground">Start for free, upgrade for advanced features</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Free Plan */}
          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="text-2xl font-bold text-foreground">Free</h3>
            <p className="mt-2 text-muted-foreground">Always free, forever</p>

            <button className="mt-8 w-full rounded-lg bg-primary/20 px-6 py-3 text-primary font-medium hover:bg-primary/30 transition-colors border border-primary/30">
              Add to Browser
            </button>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-foreground">Unlimited PII Detection</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-foreground">Real-time Alerts</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-foreground">One-Click Anonymization</span>
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-xl border-2 border-primary bg-card p-8">
            <div className="absolute -top-4 left-8 bg-background px-3 py-1">
              <span className="text-xs font-semibold text-primary">POPULAR</span>
            </div>

            <h3 className="text-2xl font-bold text-foreground">Pro</h3>
            <p className="mt-2 text-muted-foreground">Login required</p>

            <button className="mt-8 w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-accent transition-colors">
              Sign Up & Enhance
            </button>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-foreground">Everything in Free, plus:</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-foreground">One-Click Prompt Optimization</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-foreground">Token Saver</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckIcon className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-foreground">Advanced Prompt Engineering</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
