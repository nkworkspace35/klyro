function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Tell KLYRO",
      description:
        "Explain what's happening in your own words. No complicated prompts or perfect formatting needed.",
    },
    {
      number: "02",
      title: "KLYRO understands",
      description:
        "KLYRO breaks down your situation, identifies what matters, and turns the complexity into something easier to understand.",
    },
    {
      number: "03",
      title: "Get your next move",
      description:
        "Receive practical next steps, useful resources, and a clear direction you can actually act on.",
    },
  ]

  return (
    <section
      id="how-it-works"
      className="relative px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">

        {/* Section Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-400">
            How it works
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            From stuck to sorted.
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">
            KLYRO turns a complicated situation into something
            you can understand, plan, and act on.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group rounded-3xl border border-white/10 bg-white/[0.035] p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.05] sm:p-8"
            >
              {/* Number */}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-sm font-semibold text-violet-300">
                {step.number}
              </div>

              {/* Content */}
              <h3 className="mt-7 text-xl font-semibold text-white">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
                {step.description}
              </p>

              {/* Decorative line */}
              <div className="mt-8 h-px w-12 bg-gradient-to-r from-violet-400 to-transparent transition-all duration-300 group-hover:w-20" />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default HowItWorks