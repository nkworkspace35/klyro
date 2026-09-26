import { useState } from "react"

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-[#08090D]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <a
          href="#home"
          className="text-xl font-bold tracking-tight text-white"
        >
          KLYRO <span className="text-violet-400">✦</span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#home"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Home
          </a>

          <a
            href="#how-it-works"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            How it works
          </a>

          <a
            href="#features"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Features
          </a>

          <a
            href="#about"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            About
          </a>
        </div>

        {/* Desktop CTA */}
        <a
          href="#ask"
          className="hidden rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-400 md:block"
        >
          Ask KLYRO ✦
        </a>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          <span className="text-2xl">
            {isMenuOpen ? "×" : "☰"}
          </span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-white/10 bg-[#08090D]/95 px-4 py-5 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">

            <a
              href="#home"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Home
            </a>

            <a
              href="#how-it-works"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              How it works
            </a>

            <a
              href="#features"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#about"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              About
            </a>

            <a
              href="#ask"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 rounded-full bg-violet-500 px-5 py-2.5 text-center text-sm font-medium text-white transition hover:bg-violet-400"
            >
              Ask KLYRO ✦
            </a>

          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar