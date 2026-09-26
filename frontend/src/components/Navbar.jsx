import { useState } from "react"
import { Link } from "react-router-dom"

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-[#08090D]/80 backdrop-blur-xl">

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* KLYRO Logo */}
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-white"
        >
          KLYRO <span className="text-violet-400">✦</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">

          <a
            href="/#home"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Home
          </a>

          <a
            href="/#how-it-works"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            How it works
          </a>

          <a
            href="/#features"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Features
          </a>

          <a
            href="/#about"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            About
          </a>

        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">

          {/* Login */}
          <Link
            to="/login"
            className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            Log in
          </Link>

          {/* Signup */}
          <Link
            to="/signup"
            className="rounded-full bg-violet-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-400"
          >
            Get started ✦
          </Link>

        </div>

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
              href="/#home"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Home
            </a>

            <a
              href="/#how-it-works"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              How it works
            </a>

            <a
              href="/#features"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="/#about"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              About
            </a>

            {/* Mobile Login */}
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-center text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Log in
            </Link>

            {/* Mobile Signup */}
            <Link
              to="/signup"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-full bg-violet-500 px-5 py-2.5 text-center text-sm font-medium text-white transition hover:bg-violet-400"
            >
              Get started ✦
            </Link>

          </div>

        </div>
      )}

    </nav>
  )
}

export default Navbar