function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-20 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl sm:h-96 sm:w-96" />

      <div className="mx-auto max-w-5xl text-center">

        {/* Eyebrow */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 backdrop-blur-xl">
          <span className="text-violet-400">✦</span>
          AI-powered problem solving
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Life got complicated?
          <br />

          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Let's figure it out.
          </span>{" "}
          <span className="text-violet-400">✦</span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Tell KLYRO what's going on. Get a clear explanation,
          practical next steps, and a path forward.
        </p>

        {/* Problem Input */}
        <div
          id="ask"
          className="mx-auto mt-10 max-w-3xl"
        >
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/20 backdrop-blur-xl">

            <textarea
              rows="5"
              placeholder="What's going on?"
              className="w-full resize-none bg-transparent px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 sm:px-5 sm:py-4 sm:text-lg"
            />

            {/* Input Bottom Bar */}
            <div className="flex flex-col gap-3 border-t border-white/10 px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">

              <p className="px-2 text-left text-xs text-slate-500">
                Describe your situation naturally. No perfect prompt needed.
              </p>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                Ask KLYRO
                <span>→</span>
              </button>

            </div>
          </div>

          {/* Suggestions */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs leading-none text-slate-600">
              Try:
            </span>

            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet-400/30 hover:text-slate-200"
            >
              Career decision
            </button>

            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet-400/30 hover:text-slate-200"
            >
              Study plan
            </button>

            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet-400/30 hover:text-slate-200"
            >
              Work problem
            </button>
          </div>

        </div>

      </div>
    </section>
  )
}

export default Hero