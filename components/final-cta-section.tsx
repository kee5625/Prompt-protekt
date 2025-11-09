import { ArrowRightIcon } from "lucide-react"

export function FinalCTASection() {
  return (
    <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            Upgrade Your AI Workflow Today.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Protect your data and 10x your prompt quality. Get the best of both worlds with one simple extension.
          </p>

          <button className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-accent transition-colors">
            Add Prompt Protekt to Browser Now
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
