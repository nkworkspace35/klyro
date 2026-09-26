function Features() {
  const features = [
    {
      icon: "🧠",
      title: "Understand",
      description:
        "Explain your situation naturally. KLYRO helps break down the important parts of the problem.",
    },
    {
      icon: "⚡",
      title: "Action Plans",
      description:
        "Turn confusion into practical next steps instead of giving you another wall of information.",
    },
    {
      icon: "📄",
      title: "Documents",
      description:
        "Bring documents into the conversation and make complicated information easier to understand.",
    },
    {
      icon: "🌐",
      title: "Multilingual",
      description:
        "Communicate in the language you're comfortable with and get explanations that feel natural.",
    },
    {
      icon: "🔖",
      title: "Save Cases",
      description:
        "Keep important problems and solutions organized so you can come back to them later.",
    },
    {
      icon: "⏰",
      title: "Follow-ups",
      description:
        "Keep track of your next steps and stay connected to the plan instead of starting over.",
    },
  ]

  return (
    <section
      id="features"
      className="relative px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">

        {/* Section heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-400">
            Built for real problems
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            More than just answers.
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">
            KLYRO is designed to help you understand the situation,
            decide what matters, and actually move forward.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-white/[0.055] sm:p-7"
            >
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-xl transition duration-300 group-hover:border-cyan-400/20 group-hover:bg-cyan-400/10">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="mt-6 text-xl font-semibold text-white">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
                {feature.description}
              </p>

              {/* Decorative arrow */}
              <div className="mt-6 text-sm text-slate-600 transition duration-300 group-hover:text-cyan-400">
                Explore <span>→</span>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  )
}

export default Features