import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Dashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [problem, setProblem] = useState("")
  const [problemTitle, setProblemTitle] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // ==============================
  // FETCH LOGGED-IN USER
  // ==============================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("klyro_token")

        if (!token) {
          navigate("/login", { replace: true })
          return
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/protected`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()

        if (!response.ok) {
          localStorage.removeItem("klyro_token")
          localStorage.removeItem("klyro_user")

          setError(data.message || "Unable to load user data.")
          return
        }

        setUser(data.user)

      } catch (error) {
        setError("Unable to connect to the server.")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])


  // ==============================
  // SUBMIT PROBLEM
  // ==============================
  const handleAskKlyro = async (e) => {
    e.preventDefault()

    setError("")
    setSuccessMessage("")

    // Problem description required
    if (!problem.trim()) {
      setError("Please describe your problem first.")
      return
    }

    setSubmitting(true)

    try {
      const token = localStorage.getItem("klyro_token")

      // Token missing
      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/problems`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: problemTitle.trim() || "Untitled problem",
            description: problem.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Unable to save your problem.")
        return
      }

      // Success
      setSuccessMessage(
        "Your problem has been saved successfully."
      )

      // Clear form
      setProblem("")
      setProblemTitle("")

      console.log("Saved problem:", data.problem)

    } catch (error) {
      setError("Unable to connect to the server.")
    } finally {
      setSubmitting(false)
    }
  }


  // ==============================
  // LOGOUT
  // ==============================
  const handleLogout = () => {
    localStorage.removeItem("klyro_token")
    localStorage.removeItem("klyro_user")

    navigate("/login", { replace: true })
  }


  return (
    <div className="min-h-screen bg-[#08090D] text-white">

      {/* ==============================
          DASHBOARD NAVBAR
      =============================== */}
      <header className="border-b border-white/10 bg-[#08090D]/80 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-xl font-bold tracking-tight"
          >
            KLYRO <span className="text-violet-400">✦</span>
          </button>


          {/* User / Logout */}
          <div className="flex items-center gap-4">

            {user && (
              <div className="hidden text-right sm:block">

                <p className="text-sm font-medium text-white">
                  {user.name}
                </p>

                <p className="text-xs text-slate-500">
                  {user.email}
                </p>

              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              Logout
            </button>

          </div>

        </div>

      </header>


      {/* ==============================
          MAIN
      =============================== */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">


        {/* ==============================
            LOADING
        =============================== */}
        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <p className="text-sm text-slate-400">
              Loading your workspace...
            </p>

          </div>
        )}


        {/* ==============================
            ERROR
        =============================== */}
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3">

            <p className="text-sm text-rose-300">
              {error}
            </p>

          </div>
        )}


        {/* ==============================
            SUCCESS
        =============================== */}
        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">

            <p className="text-sm text-emerald-300">
              {successMessage}
            </p>

          </div>
        )}


        {/* ==============================
            DASHBOARD CONTENT
        =============================== */}
        {!loading && user && (
          <>

            {/* ==============================
                WELCOME
            =============================== */}
            <section className="mb-10">

              <p className="text-sm font-medium text-violet-400">
                Welcome back, {user.name}
              </p>

              <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
                What’s going on?
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                Tell KLYRO what you’re dealing with. We’ll help you
                understand the problem and figure out your next move.
              </p>

            </section>


            {/* ==============================
                PROBLEM INPUT
            =============================== */}
            <section className="max-w-4xl">

              <form onSubmit={handleAskKlyro}>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">


                  {/* Input Header */}
                  <div className="mb-4 flex items-center justify-between">

                    <div>

                      <p className="text-sm font-medium text-white">
                        Describe your problem
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Give KLYRO as much context as you can.
                      </p>

                    </div>


                    <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-500 sm:block">
                      AI powered
                    </span>

                  </div>


                  {/* Problem Title */}
                  <input
                    type="text"
                    value={problemTitle}
                    onChange={(e) => setProblemTitle(e.target.value)}
                    placeholder="Give your problem a short title (optional)"
                    className="mb-3 w-full rounded-2xl border border-white/10 bg-[#0D0F15] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50"
                  />


                  {/* Problem Description */}
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="Example: I have an interview next week but I don't know how to prepare..."
                    rows="7"
                    className="w-full resize-none rounded-2xl border border-white/10 bg-[#0D0F15] px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50"
                  />


                  {/* Bottom Bar */}
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-xs text-slate-600">
                      Your problem will be saved to your KLYRO workspace.
                    </p>


                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-2xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting
                        ? "Saving..."
                        : "Ask KLYRO ✦"}
                    </button>

                  </div>

                </div>

              </form>

            </section>


            {/* ==============================
                QUICK ACTIONS
            =============================== */}
            <section className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">


              {/* Understand */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]">

                <p className="text-sm font-medium text-white">
                  🧠 Understand
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Break complicated situations into simple explanations.
                </p>

              </div>


              {/* Take Action */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]">

                <p className="text-sm font-medium text-white">
                  ⚡ Take action
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Get practical steps instead of generic advice.
                </p>

              </div>


              {/* Track */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]">

                <p className="text-sm font-medium text-white">
                  📌 Track
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Save problems and follow your progress over time.
                </p>

              </div>

            </section>

          </>
        )}

      </main>

    </div>
  )
}

export default Dashboard