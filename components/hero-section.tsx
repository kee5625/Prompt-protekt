import { ArrowRightIcon } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
      {/* Background gradient elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Secure & Supercharge Your AI Prompts.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Meet Prompt Protekt. The all-in-one extension that sanitizes your data and enhances your prompts for
                better, safer AI conversations.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-accent transition-colors">
                Add to Browser — It's Free
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Visual - Data Protection Animation */}
          <div className="relative h-96 rounded-2xl border border-border bg-card p-8">
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Sending to ChatGPT...</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Name:</span>
                    <span className="text-sm line-through text-muted-foreground">John Doe</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Email:</span>
                    <span className="text-sm line-through text-muted-foreground">john@example.com</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Phone:</span>
                    <span className="text-sm line-through text-muted-foreground">555-123-4567</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                  PII Detected & Anonymized
                </div>
              </div>

              <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/30">
                <p className="text-sm text-green-400">Safe to send:</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Name:</span>
                    <span className="text-sm text-green-400">Person A</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Email:</span>
                    <span className="text-sm text-green-400">[EMAIL_REDACTED]</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Phone:</span>
                    <span className="text-sm text-green-400">[PHONE_REDACTED]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
