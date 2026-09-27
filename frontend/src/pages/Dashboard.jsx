import { useEffect, useMemo, useState } from "react"
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
  const [aiAnswer, setAiAnswer] = useState("")

  // Saved problems
  const [problems, setProblems] = useState([])
  const [problemsLoading, setProblemsLoading] = useState(false)

  // Filters / search
  const [activeFilter, setActiveFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState("newest")

  // Problem currently being deleted
  const [deletingProblemId, setDeletingProblemId] = useState(null)


  // ==============================
  // FETCH SAVED PROBLEMS
  // ==============================
  const fetchProblems = async () => {
    try {
      setProblemsLoading(true)

      const token = localStorage.getItem("klyro_token")

      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/problems`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message || "Unable to load your saved problems."
        )
        return
      }

      setProblems(data.problems || [])
    } catch (error) {
      setError("Unable to load your saved problems.")
    } finally {
      setProblemsLoading(false)
    }
  }


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

          setError(
            data.message || "Unable to load user data."
          )

          return
        }

        setUser(data.user)

        await fetchProblems()
      } catch (error) {
        setError("Unable to connect to the server.")
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])


  // ==============================
  // ASK KLYRO
  // ==============================
  const handleAskKlyro = async (e) => {
    e.preventDefault()

    setError("")
    setSuccessMessage("")
    setAiAnswer("")

    if (!problem.trim()) {
      setError("Please describe your problem first.")
      return
    }

    setSubmitting(true)

    try {
      const token = localStorage.getItem("klyro_token")

      if (!token) {
        navigate("/login", { replace: true })
        return
      }


      // ==============================
      // STEP 1: SAVE PROBLEM
      // ==============================

      const saveResponse = await fetch(
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

      const saveData = await saveResponse.json()

      if (!saveResponse.ok) {
        setError(
          saveData.message || "Unable to save your problem."
        )
        return
      }

      const savedProblem = saveData.problem
      const problemId = savedProblem.id


      // ==============================
      // STEP 2: ASK GEMINI
      // ==============================

      const aiResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/solve-problem`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            problem: problem.trim(),
            problemId: problemId,
          }),
        }
      )

      const aiData = await aiResponse.json()

      if (!aiResponse.ok) {
        setError(
          aiData.message || "Unable to generate AI solution."
        )
        return
      }


      // ==============================
      // STEP 3: SHOW AI RESPONSE
      // ==============================

      setAiAnswer(aiData.answer || "")

      setSuccessMessage(
        "Problem saved. KLYRO has generated your next move."
      )


      // ==============================
      // STEP 4: UPDATE PROBLEM LIST
      // ==============================

      if (aiData.problem) {
        setProblems((previousProblems) => [
          aiData.problem,
          ...previousProblems,
        ])
      }


      // ==============================
      // STEP 5: CLEAR FORM
      // ==============================

      setProblem("")
      setProblemTitle("")

      setActiveFilter("active")

    } catch (error) {
      setError("Unable to connect to the server.")
    } finally {
      setSubmitting(false)
    }
  }


  // ==============================
  // DELETE PROBLEM
  // ==============================
  const handleDeleteProblem = async (problemId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this problem? This action cannot be undone."
    )

    if (!confirmed) {
      return
    }

    try {
      setError("")
      setSuccessMessage("")
      setDeletingProblemId(problemId)

      const token = localStorage.getItem("klyro_token")

      if (!token) {
        navigate("/login", { replace: true })
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/problems/${problemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message || "Unable to delete problem."
        )
        return
      }

      setProblems((previousProblems) =>
        previousProblems.filter(
          (item) => item.id !== problemId
        )
      )

      setSuccessMessage(
        "Problem deleted successfully."
      )

    } catch (error) {
      setError("Unable to connect to the server.")
    } finally {
      setDeletingProblemId(null)
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


  // ==============================
  // USER INITIAL
  // ==============================
  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : "U"


  // ==============================
  // FILTER + SEARCH + SORT
  // ==============================
  const filteredProblems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const result = problems.filter((item) => {

      const matchesStatus =
        activeFilter === "all" ||
        item.status === activeFilter

      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })

    return result.sort((a, b) => {

      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()

      if (sortOrder === "oldest") {
        return dateA - dateB
      }

      return dateB - dateA
    })
  }, [
    problems,
    activeFilter,
    searchQuery,
    sortOrder,
  ])


  // ==============================
  // FILTER COUNTS
  // ==============================
  const allCount = problems.length

  const activeCount = problems.filter(
    (item) => item.status === "active"
  ).length

  const inProgressCount = problems.filter(
    (item) => item.status === "in_progress"
  ).length

  const resolvedCount = problems.filter(
    (item) => item.status === "resolved"
  ).length


  // ==============================
  // DATE FORMATTER
  // ==============================
  const formatDate = (date) => {
    if (!date) {
      return ""
    }

    const formatted = new Date(date)

    if (Number.isNaN(formatted.getTime())) {
      return ""
    }

    return formatted.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }


  return (
    <div className="min-h-screen bg-[#08090D] text-white">


      {/* ==============================
          HEADER
      ============================== */}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08090D]/80 backdrop-blur-2xl">

        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">


          {/* LOGO */}

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="shrink-0 text-xl font-bold tracking-tight text-white transition hover:text-slate-200"
          >
            KLYRO <span className="text-violet-400">✦</span>
          </button>


          {/* USER AREA */}

          <div className="flex items-center gap-3">


            {user && (
              <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 py-2 shadow-lg shadow-black/10 backdrop-blur-xl transition hover:border-white/15 hover:bg-white/[0.07]">


                {/* GLASSY DP */}

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/25 to-cyan-400/10 text-sm font-semibold text-white shadow-inner shadow-white/5">

                  {userInitial}

                </div>


                {/* USER DETAILS */}

                <div className="hidden min-w-0 text-left sm:block">

                  <p className="max-w-40 truncate text-sm font-semibold tracking-tight text-white">

                    {user.name}

                  </p>

                  <p className="max-w-40 truncate text-xs text-slate-500">

                    {user.email}

                  </p>

                </div>

              </div>
            )}


            {/* LOGOUT */}

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/15 hover:bg-white/[0.08] hover:text-white"
            >
              Logout
            </button>

          </div>

        </div>

      </header>


      {/* ==============================
          MAIN
      ============================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">


        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3">

            <p className="text-sm text-rose-300">
              {error}
            </p>

          </div>
        )}


        {/* SUCCESS */}

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">

            <p className="text-sm text-emerald-300">
              {successMessage}
            </p>

          </div>
        )}


        {/* ==============================
            INITIAL LOADING
        ============================== */}

        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">

            <div className="flex items-center gap-3">

              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />

              <p className="text-sm text-slate-400">
                Loading your workspace...
              </p>

            </div>

          </div>
        )}


        {!loading && user && (
          <>


            {/* ==============================
                INTRO
            ============================== */}

            <section className="mb-8">

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
                STATISTICS
            ============================== */}

            <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">

                <p className="text-xs text-slate-500">
                  Total
                </p>

                <p className="mt-2 text-2xl font-semibold text-white">
                  {allCount}
                </p>

              </div>


              <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.03] p-4">

                <p className="text-xs text-slate-500">
                  Active
                </p>

                <p className="mt-2 text-2xl font-semibold text-amber-300">
                  {activeCount}
                </p>

              </div>


              <div className="rounded-2xl border border-violet-400/10 bg-violet-400/[0.03] p-4">

                <p className="text-xs text-slate-500">
                  In progress
                </p>

                <p className="mt-2 text-2xl font-semibold text-violet-300">
                  {inProgressCount}
                </p>

              </div>


              <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.03] p-4">

                <p className="text-xs text-slate-500">
                  Resolved
                </p>

                <p className="mt-2 text-2xl font-semibold text-emerald-300">
                  {resolvedCount}
                </p>

              </div>

            </section>


            {/* ==============================
                PROBLEM FORM
            ============================== */}

            <section className="max-w-4xl">

              <form onSubmit={handleAskKlyro}>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">


                  <div className="mb-4 flex items-center justify-between gap-3">

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


                  <input
                    type="text"
                    value={problemTitle}
                    onChange={(e) => setProblemTitle(e.target.value)}
                    placeholder="Give your problem a short title (optional)"
                    className="mb-3 w-full rounded-2xl border border-white/10 bg-[#0D0F15] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:bg-[#10131B]"
                  />


                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="Example: I have an interview next week but I don't know how to prepare..."
                    rows="7"
                    className="w-full resize-none rounded-2xl border border-white/10 bg-[#0D0F15] px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:bg-[#10131B]"
                  />


                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <p className="text-xs leading-5 text-slate-600">
                      KLYRO will analyze your problem and suggest practical next steps.
                    </p>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-2xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting
                        ? "KLYRO is thinking..."
                        : "Ask KLYRO ✦"}
                    </button>

                  </div>

                </div>

              </form>

            </section>


            {/* ==============================
                AI RESPONSE
            ============================== */}

            {aiAnswer && (
              <section className="mt-10 max-w-4xl">

                <div className="overflow-hidden rounded-3xl border border-violet-400/20 bg-white/[0.04] shadow-2xl shadow-violet-950/20 backdrop-blur-xl">

                  <div className="border-b border-white/10 bg-violet-500/[0.06] px-5 py-4 sm:px-6">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/20 text-violet-300">
                        ✦
                      </div>

                      <div>

                        <p className="text-sm font-semibold text-white">
                          KLYRO's take
                        </p>

                        <p className="text-xs text-slate-500">
                          Your next move starts here.
                        </p>

                      </div>

                    </div>

                  </div>


                  <div className="px-5 py-6 sm:px-6">

                    <div className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {aiAnswer}
                    </div>

                  </div>

                </div>

              </section>
            )}


            {/* ==============================
                YOUR PROBLEMS
            ============================== */}

            <section className="mt-12 max-w-4xl">


              {/* SECTION HEADER */}

              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                <div>

                  <p className="text-lg font-semibold text-white">
                    Your problems
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Your saved problems and KLYRO solutions.
                  </p>

                </div>


                <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-500">
                  {allCount} saved
                </span>

              </div>


              {/* ==============================
                  SEARCH + SORT
              ============================== */}

              {!problemsLoading && problems.length > 0 && (
                <div className="mb-5 flex flex-col gap-3 sm:flex-row">

                  <div className="relative flex-1">

                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      ⌕
                    </span>

                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) =>
                        setSearchQuery(e.target.value)
                      }
                      placeholder="Search your problems..."
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:bg-white/[0.05]"
                    />

                  </div>


                  <select
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value)
                    }
                    className="rounded-2xl border border-white/10 bg-[#11141C] px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-violet-400/40"
                  >

                    <option value="newest">
                      Newest first
                    </option>

                    <option value="oldest">
                      Oldest first
                    </option>

                  </select>

                </div>
              )}


              {/* ==============================
                  FILTER TABS
              ============================== */}

              {!problemsLoading && problems.length > 0 && (
                <div className="mb-6 overflow-x-auto">

                  <div className="flex min-w-max gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">


                    {/* ALL */}

                    <button
                      type="button"
                      onClick={() => setActiveFilter("all")}
                      className={`rounded-xl px-4 py-2 text-sm transition ${
                        activeFilter === "all"
                          ? "bg-white/[0.10] text-white"
                          : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                      }`}
                    >
                      All

                      <span className="ml-2 text-xs opacity-60">
                        {allCount}
                      </span>

                    </button>


                    {/* ACTIVE */}

                    <button
                      type="button"
                      onClick={() => setActiveFilter("active")}
                      className={`rounded-xl px-4 py-2 text-sm transition ${
                        activeFilter === "active"
                          ? "bg-amber-400/10 text-amber-300"
                          : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                      }`}
                    >
                      Active

                      <span className="ml-2 text-xs opacity-60">
                        {activeCount}
                      </span>

                    </button>


                    {/* IN PROGRESS */}

                    <button
                      type="button"
                      onClick={() => setActiveFilter("in_progress")}
                      className={`rounded-xl px-4 py-2 text-sm transition ${
                        activeFilter === "in_progress"
                          ? "bg-violet-400/10 text-violet-300"
                          : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                      }`}
                    >
                      In progress

                      <span className="ml-2 text-xs opacity-60">
                        {inProgressCount}
                      </span>

                    </button>


                    {/* RESOLVED */}

                    <button
                      type="button"
                      onClick={() => setActiveFilter("resolved")}
                      className={`rounded-xl px-4 py-2 text-sm transition ${
                        activeFilter === "resolved"
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                      }`}
                    >
                      Resolved

                      <span className="ml-2 text-xs opacity-60">
                        {resolvedCount}
                      </span>

                    </button>

                  </div>

                </div>
              )}


              {/* ==============================
                  LOADING PROBLEMS
              ============================== */}

              {problemsLoading && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                  <div className="flex items-center gap-3">

                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />

                    <p className="text-sm text-slate-500">
                      Loading your problems...
                    </p>

                  </div>

                </div>
              )}


              {/* ==============================
                  NO PROBLEMS
              ============================== */}

              {!problemsLoading && problems.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-violet-300">
                    ✦
                  </div>

                  <p className="mt-4 text-sm font-medium text-slate-300">
                    No problems yet
                  </p>

                  <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-600">
                    Your first problem will appear here after you ask KLYRO.
                  </p>

                </div>
              )}


              {/* ==============================
                  SEARCH / FILTER NO RESULTS
              ============================== */}

              {!problemsLoading &&
                problems.length > 0 &&
                filteredProblems.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg text-slate-500">
                      ⌕
                    </div>

                    <p className="mt-4 text-sm font-medium text-slate-300">
                      No matching problems
                    </p>

                    <p className="mt-2 text-xs text-slate-600">
                      Try another search term or status filter.
                    </p>

                  </div>
                )}


              {/* ==============================
                  FILTERED PROBLEM LIST
              ============================== */}

              {!problemsLoading &&
                filteredProblems.length > 0 && (

                  <div className="space-y-4">

                    {filteredProblems.map((item) => (

                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
                      >

                        <div className="flex flex-col gap-5">


                          {/* PROBLEM INFO */}

                          <div className="min-w-0">

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                              <h3 className="font-medium leading-6 text-white">
                                {item.title || "Untitled problem"}
                              </h3>

                              {item.created_at && (
                                <span className="shrink-0 text-xs text-slate-600">
                                  {formatDate(item.created_at)}
                                </span>
                              )}

                            </div>


                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                              {item.description}
                            </p>


                            {/* STATUS BADGES */}

                            <div className="mt-3 flex flex-wrap items-center gap-2">


                              {/* PROBLEM STATUS */}

                              <span
                                className={`rounded-full border px-3 py-1 text-xs ${
                                  item.status === "resolved"
                                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                    : item.status === "in_progress"
                                    ? "border-violet-400/20 bg-violet-400/10 text-violet-300"
                                    : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                                }`}
                              >

                                {item.status === "resolved"
                                  ? "Resolved"
                                  : item.status === "in_progress"
                                  ? "In progress"
                                  : "Active"}

                              </span>


                              {/* AI STATUS */}

                              <span
                                className={`rounded-full border px-3 py-1 text-xs ${
                                  item.ai_status === "completed"
                                    ? "border-white/10 bg-white/[0.04] text-slate-400"
                                    : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                                }`}
                              >

                                {item.ai_status === "completed"
                                  ? "AI completed"
                                  : "AI pending"}

                              </span>

                            </div>

                          </div>


                          {/* ACTION BUTTONS */}

                          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">


                            {/* VIEW */}

                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/problems/${item.id}`)
                              }
                              className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20 hover:text-violet-200"
                            >
                              View →
                            </button>


                            {/* DELETE */}

                            <button
                              type="button"
                              disabled={deletingProblemId === item.id}
                              onClick={() =>
                                handleDeleteProblem(item.id)
                              }
                              className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-400/20 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              {deletingProblemId === item.id
                                ? "Deleting..."
                                : "Delete"}

                            </button>

                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

            </section>


            {/* ==============================
                FEATURE CARDS
            ============================== */}

            <section className="mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">


              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.05]">

                <p className="text-sm font-medium text-white">
                  🧠 Understand
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Break complicated situations into simple explanations.
                </p>

              </div>


              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.05]">

                <p className="text-sm font-medium text-white">
                  ⚡ Take action
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Get practical steps instead of generic advice.
                </p>

              </div>


              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.05]">

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