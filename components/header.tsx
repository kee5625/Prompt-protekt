"use client"

import { useState } from "react"
import { ShieldIcon, MenuIcon, XIcon } from "lucide-react"
const EXTENSION_STORE_URL = "https://chromewebstore.google.com/detail/web-paint-page-marker-edi/mnopmeepcnldaopgndiielmfoblaennk?hl=en-US&utm_source=ext_sidebar"
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const onBtnClick = () => {
    window.open(EXTENSION_STORE_URL, "_blank", "noopener,noreferrer")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ShieldIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Prompt Protekt</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex">
            <button onClick={() => onBtnClick() } className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-accent transition-colors">
              Add to Browser
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="border-t border-border py-4 md:hidden">
            <a href="#features" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </a>
            <button className="mx-4 mt-4 w-[calc(100%-2rem)] rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground">
              Add to Browser
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
