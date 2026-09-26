function FinalCTA() {
  return (
    <section
      id="about"
      className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] px-6 py-14 text-center backdrop-blur-xl sm:px-10 sm:py-16 lg:px-16">

          {/* Small label */}
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
            <span>✦</span>
            Ready when you are
          </div>

          {/* Heading */}
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Got a problem?
            <br />

            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Let's figure it out.
            </span>
          </h2>

          {/* Description */}
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            You don't need to have everything figured out.
            Just tell KLYRO what's going on and take the next step.
          </p>

          {/* CTA */}
          <div className="mt-8">
            <a
              href="#ask"
              className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-violet-400 hover:shadow-lg hover:shadow-violet-500/20"
            >
              Ask KLYRO
              <span>→</span>
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}

export default FinalCTA