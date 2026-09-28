import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL

function DashboardSection() {
  const navigate = useNavigate()

  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("newest")

  const getToken = () => {
    return localStorage.getItem("klyro_token")
  }

  const loadProblems = async () => {
    const token = getToken()

    if (!token) {
      setProblems([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await fetch(
        `${API_URL}/api/problems`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load your problems."
        )
      }

      setProblems(
        data.problems ||
          data.data?.problems ||
          data.data ||
          []
      )
    } catch (err) {
      console.error("Dashboard error:", err)
      setError(
        err.message || "Unable to load your problems."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProblems()

    const refresh = () => {
      loadProblems()
    }

    const authChange = () => {
      loadProblems()
    }

    window.addEventListener(
      "klyro-problems-refresh",
      refresh
    )

    window.addEventListener(
      "klyro-auth-change",
      authChange
    )

    return () => {
      window.removeEventListener(
        "klyro-problems-refresh",
        refresh
      )

      window.removeEventListener(
        "klyro-auth-change",
        authChange
      )
    }
  }, [])

  const stats = useMemo(() => {
    return {
      total: problems.length,
      active: problems.filter(
        (problem) => problem.status === "active"
      ).length,
      inProgress: problems.filter(
        (problem) => problem.status === "in_progress"
      ).length,
      resolved: problems.filter(
        (problem) => problem.status === "resolved"
      ).length,
    }
  }, [problems])

  const filteredProblems = useMemo(() => {
    let result = [...problems]

    if (filter !== "all") {
      result = result.filter(
        (problem) => problem.status === filter
      )
    }

    const searchText = search.trim().toLowerCase()

    if (searchText) {
      result = result.filter((problem) => {
        const title =
          problem.title?.toLowerCase() || ""

        const description =
          problem.description?.toLowerCase() || ""

        return (
          title.includes(searchText) ||
          description.includes(searchText)
        )
      })
    }

    result.sort((a, b) => {
      const dateA = new Date(
        a.created_at || a.createdAt
      ).getTime()

      const dateB = new Date(
        b.created_at || b.createdAt
      ).getTime()

      return sort === "newest"
        ? dateB - dateA
        : dateA - dateB
    })

    return result
  }, [problems, search, filter, sort])

  const updateStatus = async (problemId, status) => {
    const token = getToken()

    try {
      const response = await fetch(
        `${API_URL}/api/problems/${problemId}/status`,
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
          data.message || "Unable to update status."
        )
      }

      loadProblems()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteProblem = async (problemId) => {
    const confirmed = window.confirm(
      "Delete this problem?"
    )

    if (!confirmed) return

    const token = getToken()

    try {
      const response = await fetch(
        `${API_URL}/api/problems/${problemId}`,
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
          data.message || "Unable to delete problem."
        )
      }

      loadProblems()
    } catch (err) {
      setError(err.message)
    }
  }

  const getStatusLabel = (status) => {
    if (status === "resolved") return "Resolved"
    if (status === "in_progress") return "In progress"
    return "Active"
  }

  const getStatusClass = (status) => {
    if (status === "resolved") {
      return "bg-emerald-400/10 text-emerald-300 border-emerald-400/10"
    }

    if (status === "in_progress") {
      return "bg-amber-400/10 text-amber-300 border-amber-400/10"
    }

    return "bg-violet-400/10 text-violet-300 border-violet-400/10"
  }

  return (
    <section
      id="workspace"
      className="border-t border-white/[0.06] px-6 py-20 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Your workspace
            </p>

            <h2 className="text-3xl font-semibold text-white">
              Your problems
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Keep track of the things you’ve asked KLYRO
              to help you with.
            </p>
          </div>

          <button
            onClick={() => {
              document
                .getElementById("ask")
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
            }}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-200"
          >
            Ask another problem
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-slate-500">
              Total
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-slate-500">
              Active
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {stats.active}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-slate-500">
              In progress
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {stats.inProgress}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-slate-500">
              Resolved
            </p>

            <p className="mt-2 text-2xl font-semibold text-white">
              {stats.resolved}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search your problems..."
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/30"
          />

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
            className="rounded-xl border border-white/10 bg-[#11141c] px-4 py-3 text-sm text-slate-300 outline-none"
          >
            <option value="all">
              All
            </option>

            <option value="active">
              Active
            </option>

            <option value="in_progress">
              In progress
            </option>

            <option value="resolved">
              Resolved
            </option>
          </select>

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value)
            }
            className="rounded-xl border border-white/10 bg-[#11141c] px-4 py-3 text-sm text-slate-300 outline-none"
          >
            <option value="newest">
              Newest
            </option>

            <option value="oldest">
              Oldest
            </option>
          </select>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-400/10 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-500">
            Loading your problems...
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-violet-300">
              ✦
            </div>

            <h3 className="mt-4 font-medium text-white">
              Nothing here yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Ask KLYRO something above and your question
              will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {filteredProblems.map((problem) => (
              <div
                key={problem.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.045]"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] ${getStatusClass(
                          problem.status
                        )}`}
                      >
                        {getStatusLabel(problem.status)}
                      </span>

                      <span className="text-xs text-slate-600">
                        {new Date(
                          problem.created_at ||
                            problem.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="mt-3 truncate text-base font-medium text-white">
                      {problem.title ||
                        "Untitled problem"}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                      {problem.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      onClick={() =>
                        navigate(
                          `/problems/${problem.id}?mode=guidance`
                        )
                      }
                      className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.06]"
                    >
                      Guidance
                    </button>

                    {problem.status !== "resolved" && (
                      <button
                        onClick={() =>
                          updateStatus(
                            problem.id,
                            "resolved"
                          )
                        }
                        className="rounded-lg border border-emerald-400/10 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-300 transition hover:bg-emerald-400/10"
                      >
                        Resolve
                      </button>
                    )}

                    <button
                      onClick={() =>
                        deleteProblem(problem.id)
                      }
                      className="rounded-lg border border-rose-400/10 bg-rose-400/5 px-3 py-2 text-xs text-rose-300 transition hover:bg-rose-400/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default DashboardSection