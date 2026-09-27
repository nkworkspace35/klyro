import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Hero() {
  const navigate = useNavigate()

  const [isLoggedIn, setIsLoggedIn] =
    useState(false)

  const [description, setDescription] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [selectedExample, setSelectedExample] =
    useState("")

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(
        Boolean(
          localStorage.getItem(
            "klyro_token"
          )
        )
      )
    }

    syncAuth()

    window.addEventListener(
      "klyro-auth-change",
      syncAuth
    )

    return () => {
      window.removeEventListener(
        "klyro-auth-change",
        syncAuth
      )
    }
  }, [])

  const handleExample = (text) => {
    setSelectedExample(text)
    setDescription(text)
    setError("")
  }

  const handleAskKlyro = async () => {
    setError("")

    if (!description.trim()) {
      setError(
        "Tell KLYRO what's going on first."
      )
      return
    }

    if (!isLoggedIn) {
      localStorage.setItem(
        "klyro_pending_problem",
        description.trim()
      )

      navigate("/login")
      return
    }

    try {
      setLoading(true)

      const token =
        localStorage.getItem(
          "klyro_token"
        )

      if (!token) {
        navigate("/login")
        return
      }

      const createResponse =
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/problems`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title:
                "Untitled problem",
              description:
                description.trim(),
            }),
          }
        )

      const createData =
        await createResponse.json()

      if (!createResponse.ok) {
        setError(
          createData.message ||
            "Unable to create your problem."
        )
        return
      }

      const problemId =
        createData.problem.id

      window.dispatchEvent(
        new Event(
          "klyro-problems-refresh"
        )
      )

      const aiResponse =
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/solve-problem`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              problemId,
            }),
          }
        )

      const aiData =
        await aiResponse.json()

      if (!aiResponse.ok) {
        navigate(
          `/problems/${problemId}`
        )
        return
      }

      window.dispatchEvent(
        new Event(
          "klyro-problems-refresh"
        )
      )

      navigate(
        `/problems/${problemId}`
      )
    } catch (error) {
      setError(
        "Unable to connect to the server."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="home"
      className="relative overflow-hidden px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:px-8 lg:pb-20 lg:pt-32"
    >

      <div className="pointer-events-none absolute left-1/2 top-20 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl sm:h-96 sm:w-96" />

      <div className="pointer-events-none absolute left-10 top-64 -z-10 h-40 w-40 rounded-full bg-cyan-400/[0.04] blur-3xl" />

      <div className="mx-auto max-w-5xl text-center">

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 backdrop-blur-xl">

          <span className="text-violet-400">
            ✦
          </span>

          AI-powered problem solving

        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">

          {isLoggedIn ? (
            <>
              What's going on?
              <br />

              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Let's figure it out.
              </span>{" "}

              <span className="text-violet-400">
                ✦
              </span>
            </>
          ) : (
            <>
              Life got complicated?
              <br />

              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Let's figure it out.
              </span>{" "}

              <span className="text-violet-400">
                ✦
              </span>
            </>
          )}

        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">

          {isLoggedIn
            ? "Tell KLYRO what's going on. I'll break it down and help you figure out your next move."
            : "Tell KLYRO what's going on. Get a clear explanation, practical next steps, and a path forward."}

        </p>

        <div
          id="ask"
          className="mx-auto mt-10 max-w-3xl"
        >

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/20 backdrop-blur-xl">

            <textarea
              rows="5"
              value={description}
              onChange={(e) => {
                setDescription(
                  e.target.value
                )
                setSelectedExample("")
                setError("")
              }}
              placeholder="What's going on?"
              disabled={loading}
              className="w-full resize-none bg-transparent px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 sm:px-5 sm:py-4 sm:text-lg disabled:opacity-60"
            />

            <div className="flex flex-col gap-3 border-t border-white/10 px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">

              <p className="px-2 text-left text-xs text-slate-500">

                {isLoggedIn
                  ? "Your problem will be saved to your KLYRO workspace."
                  : "Describe your situation naturally. No perfect prompt needed."}

              </p>

              <button
                type="button"
                onClick={handleAskKlyro}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Figuring it out...
                  </>
                ) : (
                  <>
                    Ask KLYRO
                    <span>→</span>
                  </>
                )}

              </button>

            </div>

          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-left">

              <p className="text-sm text-rose-300">
                {error}
              </p>

            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">

            <span className="text-xs leading-none text-slate-600">
              Try:
            </span>

            <button
              type="button"
              onClick={() =>
                handleExample(
                  "I have an important career decision to make and I am confused about which option I should choose."
                )
              }
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                selectedExample
                  ? "border-violet-400/30 bg-violet-500/10 text-violet-300"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-violet-400/30 hover:text-slate-200"
              }`}
            >
              Career decision
            </button>

            <button
              type="button"
              onClick={() =>
                handleExample(
                  "I have exams coming up and I don't know how to organize my study plan."
                )
              }
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition hover:border-violet-400/30 hover:text-slate-200"
            >
              Study plan
            </button>

            <button
              type="button"
              onClick={() =>
                handleExample(
                  "I am facing a problem at work and I need help understanding what I should do next."
                )
              }
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