import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

function DashboardSection() {
  const navigate = useNavigate()

  const [user, setUser] =
    useState(null)

  const [problems, setProblems] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  const [search, setSearch] =
    useState("")

  const [filter, setFilter] =
    useState("all")

  const [sortOrder, setSortOrder] =
    useState("newest")

  const [deletingId, setDeletingId] =
    useState(null)

  const [resolvingId, setResolvingId] =
    useState(null)

  const fetchWorkspace = async () => {
    try {
      const token =
        localStorage.getItem(
          "klyro_token"
        )

      if (!token) {
        setProblems([])
        setUser(null)
        setLoading(false)
        return
      }

      const [userResponse, problemsResponse] =
        await Promise.all([
          fetch(
            `${import.meta.env.VITE_API_URL}/api/protected`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),

          fetch(
            `${import.meta.env.VITE_API_URL}/api/problems`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
        ])

      const userData =
        await userResponse.json()

      const problemsData =
        await problemsResponse.json()

      if (!userResponse.ok) {
        throw new Error(
          userData.message ||
            "Unable to load user."
        )
      }

      if (!problemsResponse.ok) {
        throw new Error(
          problemsData.message ||
            "Unable to load problems."
        )
      }

      setUser(userData.user)
      setProblems(
        problemsData.problems || []
      )
    } catch (error) {
      setError(
        error.message ||
          "Unable to load workspace."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkspace()

    const handleRefresh = () => {
      fetchWorkspace()
    }

    window.addEventListener(
      "klyro-problems-refresh",
      handleRefresh
    )

    window.addEventListener(
      "klyro-auth-change",
      handleRefresh
    )

    return () => {
      window.removeEventListener(
        "klyro-problems-refresh",
        handleRefresh
      )

      window.removeEventListener(
        "klyro-auth-change",
        handleRefresh
      )
    }
  }, [])

  const statistics = useMemo(() => {
    const total = problems.length

    const active =
      problems.filter(
        (problem) =>
          problem.status === "active"
      ).length

    const inProgress =
      problems.filter(
        (problem) =>
          problem.status ===
          "in_progress"
      ).length

    const resolved =
      problems.filter(
        (problem) =>
          problem.status ===
          "resolved"
      ).length

    return {
      total,
      active,
      inProgress,
      resolved,
    }
  }, [problems])

  const filteredProblems =
    useMemo(() => {
      let result = [...problems]

      if (filter !== "all") {
        result = result.filter(
          (problem) =>
            problem.status === filter
        )
      }

      if (search.trim()) {
        const searchText =
          search
            .toLowerCase()
            .trim()

        result = result.filter(
          (problem) =>
            problem.title
              ?.toLowerCase()
              .includes(searchText) ||
            problem.description
              ?.toLowerCase()
              .includes(searchText)
        )
      }

      result.sort((a, b) => {
        const dateA =
          new Date(
            a.created_at
          ).getTime()

        const dateB =
          new Date(
            b.created_at
          ).getTime()

        if (sortOrder === "oldest") {
          return dateA - dateB
        }

        return dateB - dateA
      })

      return result
    }, [
      problems,
      filter,
      search,
      sortOrder,
    ])

  const formatDate = (date) => {
    if (!date) {
      return ""
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )
  }

  const getStatusLabel = (
    status
  ) => {
    if (status === "in_progress") {
      return "In progress"
    }

    if (status === "resolved") {
      return "Resolved"
    }

    return "Active"
  }

  const getStatusStyle = (
    status
  ) => {
    if (status === "resolved") {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
    }

    if (status === "in_progress") {
      return "border-violet-400/20 bg-violet-400/10 text-violet-300"
    }

    return "border-amber-400/20 bg-amber-400/10 text-amber-300"
  }

  const handleDelete = async (
    problemId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this problem?"
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(problemId)
      setError("")

      const token =
        localStorage.getItem(
          "klyro_token"
        )

      const response =
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/problems/${problemId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to delete problem."
        )
        return
      }

      setProblems((current) =>
        current.filter(
          (problem) =>
            problem.id !== problemId
        )
      )

      window.dispatchEvent(
        new Event(
          "klyro-problems-refresh"
        )
      )
    } catch (error) {
      setError(
        "Unable to connect to the server."
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleResolve = async (
    problem
  ) => {
    if (
      problem.status ===
      "resolved"
    ) {
      return
    }

    try {
      setResolvingId(problem.id)
      setError("")

      const token =
        localStorage.getItem(
          "klyro_token"
        )

      const response =
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/problems/${problem.id}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status:
                "resolved",
            }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to update status."
        )
        return
      }

      setProblems((current) =>
        current.map(
          (item) =>
            item.id ===
            problem.id
              ? {
                  ...item,
                  ...data.problem,
                }
              : item
        )
      )
    } catch (error) {
      setError(
        "Unable to connect to the server."
      )
    } finally {
      setResolvingId(null)
    }
  }

  const scrollToAsk = () => {
    const element =
      document.getElementById(
        "ask"
      )

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }

  if (
    !localStorage.getItem(
      "klyro_token"
    )
  ) {
    return null
  }

  return (
    <section
      id="workspace"
      className="border-y border-white/[0.06] bg-[#0D0F15]/60 px-4 py-16 sm:px-6 lg:px-8"
    >

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-sm font-medium text-violet-400">
              Your workspace
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Welcome back
              {user?.name
                ? `, ${user.name.split(" ")[0]}`
                : ""}
              .
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Keep track of the problems you're working through and the next moves KLYRO suggested.
            </p>

          </div>

          <button
            type="button"
            onClick={scrollToAsk}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            + Ask another problem
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3">

            <p className="text-sm text-rose-300">
              {error}
            </p>

          </div>
        )}

        {/* STATISTICS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">

            <p className="text-xs text-slate-500">
              Total problems
            </p>

            <p className="mt-3 text-3xl font-semibold text-white">
              {statistics.total}
            </p>

          </div>

          <div className="rounded-3xl border border-amber-400/10 bg-amber-400/[0.04] p-5 backdrop-blur-xl">

            <p className="text-xs text-slate-500">
              Active
            </p>

            <p className="mt-3 text-3xl font-semibold text-amber-300">
              {statistics.active}
            </p>

          </div>

          <div className="rounded-3xl border border-violet-400/10 bg-violet-400/[0.04] p-5 backdrop-blur-xl">

            <p className="text-xs text-slate-500">
              In progress
            </p>

            <p className="mt-3 text-3xl font-semibold text-violet-300">
              {statistics.inProgress}
            </p>

          </div>

          <div className="rounded-3xl border border-emerald-400/10 bg-emerald-400/[0.04] p-5 backdrop-blur-xl">

            <p className="text-xs text-slate-500">
              Resolved
            </p>

            <p className="mt-3 text-3xl font-semibold text-emerald-300">
              {statistics.resolved}
            </p>

          </div>

        </div>

        {/* PROBLEM AREA */}

        <div className="mt-10">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h3 className="text-xl font-semibold text-white">
                My problems
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your saved KLYRO cases.
              </p>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <div className="relative">

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search problems..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 sm:w-64"
                />

              </div>

              <select
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(
                    e.target.value
                  )
                }
                className="rounded-xl border border-white/10 bg-[#11141C] px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-400/40"
              >

                <option value="newest">
                  Newest
                </option>

                <option value="oldest">
                  Oldest
                </option>

              </select>

            </div>

          </div>

          {/* FILTERS */}

          <div className="mt-5 flex flex-wrap gap-2">

            {[
              {
                value: "all",
                label: "All",
              },
              {
                value: "active",
                label: "Active",
              },
              {
                value: "in_progress",
                label: "In progress",
              },
              {
                value: "resolved",
                label: "Resolved",
              },
            ].map(
              (item) => (
                <button
                  key={
                    item.value
                  }
                  type="button"
                  onClick={() =>
                    setFilter(
                      item.value
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    filter ===
                    item.value
                      ? "border-violet-400/30 bg-violet-500/10 text-violet-300"
                      : "border-white/10 bg-white/[0.03] text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              )
            )}

          </div>

          {/* LOADING */}

          {loading && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8">

              <div className="flex items-center gap-3">

                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />

                <p className="text-sm text-slate-500">
                  Loading your problems...
                </p>

              </div>

            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            filteredProblems.length ===
              0 && (
              <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-xl text-violet-300">
                  ✦
                </div>

                <h4 className="mt-5 text-lg font-semibold text-white">
                  {problems.length ===
                  0
                    ? "Nothing here yet."
                    : "No problems found."}
                </h4>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {problems.length ===
                  0
                    ? "Tell KLYRO what's going on and your first problem will appear here."
                    : "Try changing your search or filter."}
                </p>

                {problems.length ===
                  0 && (
                  <button
                    type="button"
                    onClick={
                      scrollToAsk
                    }
                    className="mt-5 rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
                  >
                    Ask KLYRO ✦
                  </button>
                )}

              </div>
            )}

          {/* PROBLEMS */}

          {!loading &&
            filteredProblems.length >
              0 && (
              <div className="mt-6 grid gap-4">

                {filteredProblems.map(
                  (problem) => (
                    <article
                      key={
                        problem.id
                      }
                      className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl transition hover:border-white/[0.15] sm:p-6"
                    >

                      <div className="flex flex-col gap-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <span
                                className={`rounded-full border px-3 py-1 text-xs ${getStatusStyle(
                                  problem.status
                                )}`}
                              >
                                {getStatusLabel(
                                  problem.status
                                )}
                              </span>

                              <span className="text-xs text-slate-600">
                                {formatDate(
                                  problem.created_at
                                )}
                              </span>

                            </div>

                            <h4 className="mt-3 text-lg font-semibold text-white">
                              {problem.title ||
                                "Untitled problem"}
                            </h4>

                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                              {
                                problem.description
                              }
                            </p>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/problems/${problem.id}`
                              )
                            }
                            className="w-fit rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            Open
                          </button>

                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">

                          <div className="flex items-center gap-2">

                            <span className="text-xs text-slate-600">
                              AI:
                            </span>

                            <span
                              className={`text-xs ${
                                problem.ai_status ===
                                "completed"
                                  ? "text-emerald-300"
                                  : problem.ai_status ===
                                    "failed"
                                  ? "text-rose-300"
                                  : "text-amber-300"
                              }`}
                            >
                              {problem.ai_status ===
                              "completed"
                                ? "Solution ready"
                                : problem.ai_status ===
                                  "failed"
                                ? "Needs retry"
                                : "Processing"}
                            </span>

                          </div>

                          <div className="flex items-center gap-2">

                            {/* RESOLVE */}

                            <button
                              type="button"
                              title={
                                problem.status ===
                                "resolved"
                                  ? "Resolved"
                                  : "Mark as resolved"
                              }
                              aria-label={
                                problem.status ===
                                "resolved"
                                  ? "Resolved"
                                  : "Mark as resolved"
                              }
                              disabled={
                                problem.status ===
                                  "resolved" ||
                                resolvingId ===
                                  problem.id ||
                                deletingId ===
                                  problem.id
                              }
                              onClick={() =>
                                handleResolve(
                                  problem
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-sm text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {resolvingId ===
                              problem.id ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
                              ) : (
                                "✓"
                              )}
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              title="Edit problem"
                              aria-label="Edit problem"
                              disabled={
                                deletingId ===
                                problem.id
                              }
                              onClick={() =>
                                navigate(
                                  `/problems/${problem.id}`
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-sm text-violet-300 transition hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              ✎
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              title="Delete problem"
                              aria-label="Delete problem"
                              disabled={
                                deletingId ===
                                problem.id ||
                                resolvingId ===
                                  problem.id
                              }
                              onClick={() =>
                                handleDelete(
                                  problem.id
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-sm text-rose-300 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {deletingId ===
                              problem.id ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-300/30 border-t-rose-300" />
                              ) : (
                                "×"
                              )}
                            </button>

                          </div>

                        </div>

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

        </div>

      </div>

    </section>
  )
}

export default DashboardSection