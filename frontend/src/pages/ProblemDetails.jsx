import { useEffect, useMemo, useState } from "react"
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL

function ProblemDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const mode = searchParams.get("mode")

  const isResearchMode = mode === "research"
  const isGuidanceMode = mode === "guidance"

  const [problem, setProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const getToken = () => {
    return localStorage.getItem("klyro_token")
  }

  const loadProblem = async () => {
    const token = getToken()

    if (!token) {
      navigate("/login")
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `${API_URL}/api/problems/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load this problem."
        )
      }

      const loadedProblem =
        data.problem ||
        data.data?.problem ||
        data.data

      setProblem(loadedProblem)
    } catch (err) {
      console.error("Problem details error:", err)

      setError(
        err.message ||
          "Unable to load this problem."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProblem()
  }, [id])

  const solution = useMemo(() => {
    if (!problem) return null

    if (problem.ai_solution) {
      if (typeof problem.ai_solution === "string") {
        try {
          return JSON.parse(problem.ai_solution)
        } catch {
          return null
        }
      }

      return problem.ai_solution
    }

    if (problem.aiResponse) {
      if (typeof problem.aiResponse === "string") {
        try {
          return JSON.parse(problem.aiResponse)
        } catch {
          return null
        }
      }

      return problem.aiResponse
    }

    return null
  }, [problem])

  const actions = useMemo(() => {
    if (!problem) return []

    if (Array.isArray(problem.actions)) {
      return problem.actions
    }

    if (solution?.action_plan) {
      return solution.action_plan.map(
        (action, index) => ({
          id:
            action.id ||
            `temporary-${index}`,
          step_number:
            action.step ||
            index + 1,
          title:
            action.title ||
            `Step ${index + 1}`,
          description:
            action.description || "",
          completed:
            Boolean(action.completed),
        })
      )
    }

    return []
  }, [problem, solution])

  const completedActions = actions.filter(
    (action) => action.completed
  ).length

  const progress =
    actions.length > 0
      ? Math.round(
          (completedActions / actions.length) * 100
        )
      : 0

  const updateStatus = async (status) => {
    const token = getToken()

    if (!token) {
      navigate("/login")
      return
    }

    try {
      setUpdating(true)
      setError("")

      const response = await fetch(
        `${API_URL}/api/problems/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update problem status."
        )
      }

      setProblem((current) => ({
        ...current,
        ...(data.problem || data.data?.problem || {}),
        status:
          data.problem?.status ||
          data.data?.problem?.status ||
          status,
      }))

      window.dispatchEvent(
        new CustomEvent("klyro-problems-refresh")
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const deleteProblem = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this problem?"
    )

    if (!confirmed) return

    const token = getToken()

    if (!token) {
      navigate("/login")
      return
    }

    try {
      setUpdating(true)
      setError("")

      const response = await fetch(
        `${API_URL}/api/problems/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete this problem."
        )
      }

      window.dispatchEvent(
        new CustomEvent("klyro-problems-refresh")
      )

      navigate("/")
    } catch (err) {
      setError(err.message)
      setUpdating(false)
    }
  }

  const toggleAction = async (action) => {
    if (!action?.id) return

    if (String(action.id).startsWith("temporary-")) {
      return
    }

    const token = getToken()

    if (!token) {
      navigate("/login")
      return
    }

    const newCompleted = !action.completed

    setProblem((current) => {
      if (!current) return current

      return {
        ...current,
        actions: (current.actions || []).map(
          (item) =>
            item.id === action.id
              ? {
                  ...item,
                  completed: newCompleted,
                }
              : item
        ),
      }
    })

    try {
      const response = await fetch(
        `${API_URL}/api/problems/${id}/actions/${action.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            completed: newCompleted,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update action."
        )
      }

      if (data.action) {
        setProblem((current) => {
          if (!current) return current

          return {
            ...current,
            actions: (current.actions || []).map(
              (item) =>
                item.id === action.id
                  ? {
                      ...item,
                      ...data.action,
                    }
                  : item
            ),
          }
        })
      }
    } catch (err) {
      setError(err.message)

      setProblem((current) => {
        if (!current) return current

        return {
          ...current,
          actions: (current.actions || []).map(
            (item) =>
              item.id === action.id
                ? {
                    ...item,
                    completed: action.completed,
                  }
                : item
          ),
        }
      })
    }
  }

  const regenerateSolution = async () => {
    const token = getToken()

    if (!token) {
      navigate("/login")
      return
    }

    try {
      setRegenerating(true)
      setError("")

      const response = await fetch(
        `${API_URL}/api/solve-problem`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            problemId: id,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to regenerate the solution."
        )
      }

      const updatedProblem =
        data.problem ||
        data.data?.problem ||
        data.data

      if (updatedProblem) {
        setProblem(updatedProblem)
      } else {
        await loadProblem()
      }

      window.dispatchEvent(
        new CustomEvent("klyro-problems-refresh")
      )
    } catch (err) {
      console.error(
        "Regenerate solution error:",
        err
      )

      setError(
        err.message ||
          "Unable to regenerate the solution."
      )
    } finally {
      setRegenerating(false)
    }
  }

  const getStatusLabel = (status) => {
    if (status === "resolved") {
      return "Resolved"
    }

    if (status === "in_progress") {
      return "In progress"
    }

    return "Active"
  }

  const getStatusClass = (status) => {
    if (status === "resolved") {
      return "border-emerald-400/10 bg-emerald-400/10 text-emerald-300"
    }

    if (status === "in_progress") {
      return "border-amber-400/10 bg-amber-400/10 text-amber-300"
    }

    return "border-violet-400/10 bg-violet-400/10 text-violet-300"
  }

  const getPriorityClass = (priority) => {
    if (!priority) return ""

    const value = String(priority).toLowerCase()

    if (value === "high") {
      return "border-rose-400/10 bg-rose-400/10 text-rose-300"
    }

    if (value === "medium") {
      return "border-amber-400/10 bg-amber-400/10 text-amber-300"
    }

    return "border-emerald-400/10 bg-emerald-400/10 text-emerald-300"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090D] px-6 py-20 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-xl text-violet-300">
              ✦
            </div>

            <p className="text-sm text-slate-500">
              Loading your KLYRO guidance...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !problem) {
    return (
      <div className="min-h-screen bg-[#08090D] px-6 py-20 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-rose-400/10 bg-rose-500/5 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
              !
            </div>

            <h1 className="mt-4 text-xl font-semibold text-white">
              Something went wrong
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {error}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={loadProblem}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
              >
                Try again
              </button>

              <Link
                to="/"
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300"
              >
                Back to KLYRO
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!problem) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#08090D] text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090D]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight text-white"
          >
            KLYRO <span className="text-violet-400">✦</span>
          </Link>

          <Link
            to="/"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="px-6 py-10 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            {isResearchMode ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                  Deep Research
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Let’s go deeper.
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                  A deeper breakdown of your problem,
                  possible causes, options and next
                  actions.
                </p>
              </>
            ) : isGuidanceMode ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                  Guidance
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Let’s figure this out.
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                  Step-by-step guidance to move from
                  stuck to sorted.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                  KLYRO
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Your problem, broken down.
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                  Here’s a structured breakdown of your
                  problem and what you can do next.
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-400/10 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="border-b border-white/[0.06] p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs ${getStatusClass(
                    problem.status
                  )}`}
                >
                  {getStatusLabel(problem.status)}
                </span>

                {problem.category && (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400">
                    {problem.category}
                  </span>
                )}

                {problem.priority && (
                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs ${getPriorityClass(
                      problem.priority
                    )}`}
                  >
                    {problem.priority}
                  </span>
                )}
              </div>

              <h2 className="mt-5 text-2xl font-semibold text-white sm:text-3xl">
                {problem.title ||
                  "Untitled problem"}
              </h2>

              <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/10 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {problem.description}
                </p>
              </div>
            </div>

            <div className="space-y-8 p-6 sm:p-8">
              {solution?.summary && (
                <section>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                      ✦
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                        Quick answer
                      </p>

                      <h3 className="mt-1 text-lg font-semibold text-white">
                        In short
                      </h3>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-violet-400/10 bg-violet-500/[0.04] p-5">
                    <p className="text-sm leading-7 text-slate-300">
                      {solution.summary}
                    </p>
                  </div>
                </section>
              )}

              {solution?.what_is_happening && (
                <section>
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      01
                    </p>

                    <h3 className="mt-1 text-xl font-semibold text-white">
                      What is happening?
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-5">
                    <p className="text-sm leading-7 text-slate-300">
                      {solution.what_is_happening}
                    </p>
                  </div>
                </section>
              )}

              {Array.isArray(
                solution?.why_this_may_be_happening
              ) &&
                solution.why_this_may_be_happening
                  .length > 0 && (
                  <section>
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        02
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-white">
                        Why this may be happening
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {solution.why_this_may_be_happening.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex gap-3 rounded-2xl border border-white/[0.06] bg-black/10 p-4"
                          >
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-xs text-slate-400">
                              {index + 1}
                            </span>

                            <p className="text-sm leading-7 text-slate-300">
                              {item}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                )}

              {Array.isArray(
                solution?.what_to_do_next
              ) &&
                solution.what_to_do_next.length > 0 && (
                  <section>
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        03
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-white">
                        What to do next
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {solution.what_to_do_next.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex gap-3 rounded-2xl border border-white/[0.06] bg-black/10 p-4"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs text-violet-300">
                              {index + 1}
                            </span>

                            <p className="text-sm leading-7 text-slate-300">
                              {item}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                )}

              {actions.length > 0 && (
                <section>
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Action plan
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-white">
                        Your next moves
                      </h3>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-sm font-medium text-white">
                        {completedActions} /{" "}
                        {actions.length} completed
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {progress}% complete
                      </p>
                    </div>
                  </div>

                  <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    {actions.map(
                      (action, index) => (
                        <button
                          key={
                            action.id ||
                            `${action.step_number}-${index}`
                          }
                          onClick={() =>
                            toggleAction(action)
                          }
                          disabled={String(
                            action.id
                          ).startsWith(
                            "temporary-"
                          )}
                          className={`group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                            action.completed
                              ? "border-emerald-400/10 bg-emerald-400/[0.04]"
                              : "border-white/[0.06] bg-black/10 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs font-medium transition ${
                              action.completed
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                : "border-white/10 bg-white/[0.03] text-slate-500 group-hover:border-violet-400/20 group-hover:text-violet-300"
                            }`}
                          >
                            {action.completed
                              ? "✓"
                              : action.step_number ||
                                index + 1}
                          </div>

                          <div className="min-w-0">
                            <h4
                              className={`text-sm font-semibold ${
                                action.completed
                                  ? "text-emerald-200"
                                  : "text-white"
                              }`}
                            >
                              {action.title ||
                                `Step ${
                                  index + 1
                                }`}
                            </h4>

                            {action.description && (
                              <p
                                className={`mt-1 text-sm leading-6 ${
                                  action.completed
                                    ? "text-slate-500"
                                    : "text-slate-400"
                                }`}
                              >
                                {
                                  action.description
                                }
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </section>
              )}

              {Array.isArray(
                solution?.what_to_avoid
              ) &&
                solution.what_to_avoid.length > 0 && (
                  <section>
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        04
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-white">
                        What to avoid
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {solution.what_to_avoid.map(
                        (item, index) => (
                          <div
                            key={index}
                            className="flex gap-3 rounded-2xl border border-rose-400/[0.08] bg-rose-500/[0.03] p-4"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-xs text-rose-300">
                              !
                            </span>

                            <p className="text-sm leading-7 text-slate-400">
                              {item}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                )}

              {!solution &&
                problem.ai_response && (
                  <section>
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        KLYRO response
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-5">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                        {typeof problem.ai_response ===
                        "string"
                          ? problem.ai_response
                          : JSON.stringify(
                              problem.ai_response,
                              null,
                              2
                            )}
                      </p>
                    </div>
                  </section>
                )}

              {!solution &&
                !problem.ai_response && (
                  <section className="rounded-2xl border border-amber-400/10 bg-amber-500/[0.03] p-6">
                    <p className="text-sm text-amber-200">
                      KLYRO hasn't generated a detailed
                      solution for this problem yet.
                    </p>

                    <button
                      onClick={regenerateSolution}
                      disabled={regenerating}
                      className="mt-4 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
                    >
                      {regenerating
                        ? "Thinking..."
                        : "Generate solution"}
                    </button>
                  </section>
                )}
            </div>

            <div className="border-t border-white/[0.06] p-6 sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Keep moving.
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    You can always come back to this problem.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {problem.status !== "resolved" && (
                    <button
                      onClick={() =>
                        updateStatus("resolved")
                      }
                      disabled={updating}
                      className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-4 py-2.5 text-sm text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-50"
                    >
                      Mark resolved
                    </button>
                  )}

                  {problem.status === "resolved" && (
                    <button
                      onClick={() =>
                        updateStatus("active")
                      }
                      disabled={updating}
                      className="rounded-xl border border-violet-400/10 bg-violet-400/5 px-4 py-2.5 text-sm text-violet-300 transition hover:bg-violet-400/10 disabled:opacity-50"
                    >
                      Reopen
                    </button>
                  )}

                  <button
                    onClick={regenerateSolution}
                    disabled={regenerating}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    {regenerating
                      ? "Regenerating..."
                      : "Regenerate AI"}
                  </button>

                  <button
                    onClick={deleteProblem}
                    disabled={updating}
                    className="rounded-xl border border-rose-400/10 bg-rose-400/5 px-4 py-2.5 text-sm text-rose-300 transition hover:bg-rose-400/10 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:flex-row">
            <div>
              <p className="text-sm font-medium text-white">
                Need help with something else?
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Ask KLYRO another question whenever you’re
                ready.
              </p>
            </div>

            <button
              onClick={() => navigate("/")}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              Ask KLYRO ✦
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProblemDetails