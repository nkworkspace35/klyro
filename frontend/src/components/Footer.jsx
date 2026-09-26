function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Main Footer */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          {/* Brand */}
          <div>
            <a
              href="#home"
              className="text-xl font-bold tracking-tight text-white"
            >
              KLYRO <span className="text-violet-400">✦</span>
            </a>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Your problem. Your next move.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <a
              href="#home"
              className="text-slate-500 transition hover:text-white"
            >
              Home
            </a>

            <a
              href="#how-it-works"
              className="text-slate-500 transition hover:text-white"
            >
              How it works
            </a>

            <a
              href="#features"
              className="text-slate-500 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#ask"
              className="text-slate-500 transition hover:text-white"
            >
              Ask KLYRO
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} KLYRO. All rights reserved.
          </p>

          <p>
            Built to turn problems into next moves.
          </p>
        </div>

      </div>
    </footer>
  )
}

export default Footer