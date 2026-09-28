import {
  useEffect,
  useMemo,
  useState,
} from "react"

import { useNavigate } from "react-router-dom"

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"

function getToken() {
  const keys = [
    "klyro_token",
    "token",
    "authToken",
    "accessToken",
    "access_token",
    "jwt",
  ]

  for (const key of keys) {
    const value =
      localStorage.getItem(key) ||
      sessionStorage.getItem(key)

    if (!value) {
      continue
    }

    try {
      const parsed = JSON.parse(value)

      if (typeof parsed === "string") {
        return parsed.replace(/^Bearer\s+/i, "")
      }

      if (parsed?.token) {
        return String(parsed.token).replace(
          /^Bearer\s+/i,
          ""
        )
      }

      if (parsed?.accessToken) {
        return String(parsed.accessToken).replace(
          /^Bearer\s+/i,
          ""
        )
      }

      if (parsed?.access_token) {
        return String(parsed.access_token).replace(
          /^Bearer\s+/i,
          ""
        )
      }
    } catch {
      return String(value).replace(
        /^Bearer\s+/i,
        ""
      )
    }
  }

  return null
}

function getProblemId(problem) {
  return (
    problem?.id ||
    problem?._id ||
    problem?.problemId
  )
}

function getProblemTitle(problem) {
  return (
    problem?.title ||
    problem?.problem_title ||
    problem?.problemTitle ||
    problem?.name ||
    "Untitled problem"
  )
}

function getProblemDescription(problem) {
  return (
    problem?.description ||
    problem?.problem_description ||
    problem?.problemDescription ||
    problem?.content ||
    "No description available."
  )
}

function getProblemStatus(problem) {
  const status =
    problem?.status ||
    problem?.problem_status ||
    "active"

  return String(status).toLowerCase()
}

function getProblemDate(problem) {
  return (
    problem?.updatedAt ||
    problem?.updated_at ||
    problem?.createdAt ||
    problem?.created_at ||
    null
  )
}

function formatProblemDate(value) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function getStatusLabel(status) {
  switch (status) {
    case "active":
      return "Active"

    case "in_progress":
    case "in-progress":
    case "inprogress":
      return "In Progress"

    case "resolved":
    case "completed":
      return "Resolved"

    default:
      return status
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
  }
}

function getStatusClasses(status) {
  switch (status) {
    case "active":
      return "border-blue-400/20 bg-blue-500/10 text-blue-300"

    case "in_progress":
    case "in-progress":
    case "inprogress":
      return "border-amber-400/20 bg-amber-500/10 text-amber-300"

    case "resolved":
    case "completed":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"

    default:
      return "border-white/10 bg-white/5 text-white/50"
  }
}

export default function WorkspaceSidebar() {
  const navigate = useNavigate()

  const [workspaceOpen, setWorkspaceOpen] =
    useState(false)

  const [problems, setProblems] = useState([])

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [search, setSearch] =
    useState("")

  const [filter, setFilter] =
    useState("all")

  const [sort, setSort] =
    useState("newest")

  const [updatingProblemId, setUpdatingProblemId] =
    useState(null)

  const [deletingProblemId, setDeletingProblemId] =
    useState(null)

  /*
   * =========================================================
   * LOAD PROBLEMS
   * =========================================================
   */

  async function loadProblems() {
    const token = getToken()

    if (!token) {
      setProblems([])
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/api/problems`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data =
        await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to load problems."
        )
      }

      const list =
        Array.isArray(data?.problems)
          ? data.problems
          : Array.isArray(data?.data?.problems)
            ? data.data.problems
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : []

      setProblems(list)
    } catch (requestError) {
      console.error(
        "KLYRO WORKSPACE LOAD ERROR:",
        requestError
      )

      setError(
        requestError?.message ||
          "Unable to load your problems."
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * =========================================================
   * OPEN WORKSPACE
   * =========================================================
   */

  function openWorkspace() {
    setWorkspaceOpen(true)

    loadProblems()
  }

  /*
   * =========================================================
   * CLOSE WORKSPACE
   * =========================================================
   */

  function closeWorkspace() {
    setWorkspaceOpen(false)
  }

  /*
   * =========================================================
   * ESCAPE KEY
   * =========================================================
   */

  useEffect(() => {
    function handleEscape(event) {
      if (
        event.key === "Escape" &&
        workspaceOpen
      ) {
        closeWorkspace()
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    )

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      )
    }
  }, [workspaceOpen])

  /*
   * =========================================================
   * LISTEN FOR YOUR WORKSPACE BUTTON
   * =========================================================
   */

  useEffect(() => {
    function handleWorkspaceOpen() {
      openWorkspace()
    }

    function handleProblemsRefresh() {
      if (getToken()) {
        loadProblems()
      }
    }

    function handleAuthChange() {
      const token = getToken()

      if (!token) {
        setProblems([])
        setWorkspaceOpen(false)
        return
      }

      if (workspaceOpen) {
        loadProblems()
      }
    }

    window.addEventListener(
      "klyro-workspace-open",
      handleWorkspaceOpen
    )

    window.addEventListener(
      "klyro-problems-refresh",
      handleProblemsRefresh
    )

    window.addEventListener(
      "klyro-auth-change",
      handleAuthChange
    )

    return () => {
      window.removeEventListener(
        "klyro-workspace-open",
        handleWorkspaceOpen
      )

      window.removeEventListener(
        "klyro-problems-refresh",
        handleProblemsRefresh
      )

      window.removeEventListener(
        "klyro-auth-change",
        handleAuthChange
      )
    }
  }, [workspaceOpen])

  /*
   * =========================================================
   * INITIAL PROBLEM LOAD
   * =========================================================
   */

  useEffect(() => {
    if (getToken()) {
      loadProblems()
    }
  }, [])

  /*
   * =========================================================
   * STATISTICS
   * =========================================================
   */

  const stats = useMemo(() => {
    const total = problems.length

    const active = problems.filter(
      (problem) =>
        getProblemStatus(problem) === "active"
    ).length

    const inProgress = problems.filter(
      (problem) => {
        const status =
          getProblemStatus(problem)

        return (
          status === "in_progress" ||
          status === "in-progress" ||
          status === "inprogress"
        )
      }
    ).length

    const resolved = problems.filter(
      (problem) => {
        const status =
          getProblemStatus(problem)

        return (
          status === "resolved" ||
          status === "completed"
        )
      }
    ).length

    return {
      total,
      active,
      inProgress,
      resolved,
    }
  }, [problems])

  /*
   * =========================================================
   * FILTER + SEARCH + SORT
   * =========================================================
   */

  const filteredProblems = useMemo(() => {
    let result = [...problems]

    const normalizedSearch =
      search.trim().toLowerCase()

    if (normalizedSearch) {
      result = result.filter((problem) => {
        const title =
          getProblemTitle(problem)
            .toLowerCase()

        const description =
          getProblemDescription(problem)
            .toLowerCase()

        return (
          title.includes(normalizedSearch) ||
          description.includes(normalizedSearch)
        )
      })
    }

    if (filter !== "all") {
      result = result.filter((problem) => {
        const status =
          getProblemStatus(problem)

        if (filter === "active") {
          return status === "active"
        }

        if (filter === "in_progress") {
          return (
            status === "in_progress" ||
            status === "in-progress" ||
            status === "inprogress"
          )
        }

        if (filter === "resolved") {
          return (
            status === "resolved" ||
            status === "completed"
          )
        }

        return true
      })
    }

    result.sort((a, b) => {
      const dateA =
        new Date(
          getProblemDate(a) || 0
        ).getTime()

      const dateB =
        new Date(
          getProblemDate(b) || 0
        ).getTime()

      if (sort === "oldest") {
        return dateA - dateB
      }

      if (sort === "az") {
        return getProblemTitle(a)
          .localeCompare(
            getProblemTitle(b)
          )
      }

      if (sort === "za") {
        return getProblemTitle(b)
          .localeCompare(
            getProblemTitle(a)
          )
      }

      return dateB - dateA
    })

    return result
  }, [
    problems,
    search,
    filter,
    sort,
  ])

  /*
   * =========================================================
   * UPDATE STATUS
   * =========================================================
   */

  async function updateStatus(
    problemId,
    status
  ) {
    if (!problemId) {
      return
    }

    const token = getToken()

    if (!token) {
      setError("Please login again.")
      return
    }

    setUpdatingProblemId(problemId)
    setError("")

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

      const data =
        await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to update problem status."
        )
      }

      setProblems((current) =>
        current.map((problem) => {
          const id =
            getProblemId(problem)

          if (
            String(id) !==
            String(problemId)
          ) {
            return problem
          }

          return {
            ...problem,
            status,
          }
        })
      )

      window.dispatchEvent(
        new CustomEvent(
          "klyro-problems-refresh"
        )
      )
    } catch (requestError) {
      console.error(
        "KLYRO STATUS UPDATE ERROR:",
        requestError
      )

      setError(
        requestError?.message ||
          "Unable to update problem status."
      )
    } finally {
      setUpdatingProblemId(null)
    }
  }

  /*
   * =========================================================
   * DELETE PROBLEM
   * =========================================================
   */

  async function deleteProblem(problemId) {
    if (!problemId) {
      return
    }

    const confirmed =
      window.confirm(
        "Delete this problem?"
      )

    if (!confirmed) {
      return
    }

    const token = getToken()

    if (!token) {
      setError("Please login again.")
      return
    }

    setDeletingProblemId(problemId)
    setError("")

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

      const data =
        await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to delete problem."
        )
      }

      setProblems((current) =>
        current.filter(
          (problem) =>
            String(
              getProblemId(problem)
            ) !== String(problemId)
        )
      )

      window.dispatchEvent(
        new CustomEvent(
          "klyro-problems-refresh"
        )
      )
    } catch (requestError) {
      console.error(
        "KLYRO DELETE PROBLEM ERROR:",
        requestError
      )

      setError(
        requestError?.message ||
          "Unable to delete problem."
      )
    } finally {
      setDeletingProblemId(null)
    }
  }

  /*
   * =========================================================
   * ASK ANOTHER PROBLEM
   * =========================================================
   */

  function askAnotherProblem() {
    closeWorkspace()

    window.setTimeout(() => {
      const element =
        document.getElementById(
          "ask-klyro"
        )

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    }, 150)
  }

  /*
   * =========================================================
   * VIEW GUIDANCE
   * =========================================================
   */

  function viewProblem(problemId) {
    if (!problemId) {
      return
    }

    closeWorkspace()

    navigate(
      `/problems/${problemId}?mode=guidance`
    )
  }

  return (
    <>
      {/* =====================================================
          WORKSPACE OVERLAY
          ===================================================== */}

      {workspaceOpen && (
        <div
          className="
            fixed
            inset-0
            z-[110]
            bg-black/50
            backdrop-blur-[2px]
          "
          onClick={closeWorkspace}
        />
      )}

      {/* =====================================================
          WORKSPACE DRAWER
          ===================================================== */}

      <aside
        className={`
          fixed
          right-0
          top-0
          z-[120]
          flex
          h-screen
          w-full
          max-w-[520px]
          flex-col
          border-l
          border-white/10
          bg-[#0B0D12]
          shadow-[-20px_0_80px_rgba(0,0,0,0.45)]
          transition-transform
          duration-300
          ease-out
          ${
            workspaceOpen
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
        aria-hidden={!workspaceOpen}
      >
        {/* =================================================
            HEADER
            ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-white/10
            px-5
            py-4
          "
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/10
                  bg-white/5
                  text-white/70
                "
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10Z" />
                  <path d="M3 10h18" />
                </svg>
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-white">
                  Your Workspace
                </h2>

                <p className="mt-0.5 truncate text-xs text-white/40">
                  Manage your saved problems
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeWorkspace}
            aria-label="Close workspace"
            title="Close"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-white/5
              text-white/70
              transition
              hover:bg-white/10
              hover:text-white
            "
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* =================================================
            STATS
            ================================================= */}

        <div
          className="
            grid
            grid-cols-4
            gap-2
            border-b
            border-white/10
            px-4
            py-3
          "
        >
          <div
            className="
              rounded-xl
              border
              border-white/5
              bg-white/[0.025]
              px-2
              py-2.5
              text-center
            "
          >
            <div className="text-lg font-semibold text-white">
              {stats.total}
            </div>

            <div className="mt-0.5 text-[10px] text-white/35">
              Total
            </div>
          </div>

          <div
            className="
              rounded-xl
              border
              border-blue-400/10
              bg-blue-500/[0.04]
              px-2
              py-2.5
              text-center
            "
          >
            <div className="text-lg font-semibold text-blue-300">
              {stats.active}
            </div>

            <div className="mt-0.5 text-[10px] text-white/35">
              Active
            </div>
          </div>

          <div
            className="
              rounded-xl
              border
              border-amber-400/10
              bg-amber-500/[0.04]
              px-2
              py-2.5
              text-center
            "
          >
            <div className="text-lg font-semibold text-amber-300">
              {stats.inProgress}
            </div>

            <div className="mt-0.5 text-[10px] text-white/35">
              Progress
            </div>
          </div>

          <div
            className="
              rounded-xl
              border
              border-emerald-400/10
              bg-emerald-500/[0.04]
              px-2
              py-2.5
              text-center
            "
          >
            <div className="text-lg font-semibold text-emerald-300">
              {stats.resolved}
            </div>

            <div className="mt-0.5 text-[10px] text-white/35">
              Resolved
            </div>
          </div>
        </div>

        {/* =================================================
            SEARCH + FILTER
            ================================================= */}

        <div
          className="
            space-y-3
            border-b
            border-white/10
            px-4
            py-4
          "
        >
          {/* SEARCH */}

          <div className="relative">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-white/30
              "
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />
              <path d="m20 20-4-4" />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search problems..."
              className="
                h-10
                w-full
                rounded-xl
                border
                border-white/10
                bg-white/[0.035]
                pl-10
                pr-3
                text-sm
                text-white
                outline-none
                placeholder:text-white/25
                transition
                focus:border-white/20
                focus:bg-white/[0.05]
              "
            />
          </div>

          {/* FILTER */}

          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {[
              {
                id: "all",
                label: "All",
              },
              {
                id: "active",
                label: "Active",
              },
              {
                id: "in_progress",
                label: "In Progress",
              },
              {
                id: "resolved",
                label: "Resolved",
              },
            ].map((item) => {
              const selected =
                filter === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setFilter(item.id)
                  }
                  className={`
                    shrink-0
                    rounded-lg
                    border
                    px-3
                    py-1.5
                    text-[11px]
                    font-medium
                    transition
                    ${
                      selected
                        ? "border-white/15 bg-white text-black"
                        : "border-white/5 bg-white/[0.025] text-white/45 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* SORT */}

          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-white/30">
              {filteredProblems.length}{" "}
              {filteredProblems.length === 1
                ? "problem"
                : "problems"}
            </span>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
              className="
                rounded-lg
                border
                border-white/10
                bg-[#11131A]
                px-2.5
                py-1.5
                text-[11px]
                text-white/60
                outline-none
                focus:border-white/20
              "
            >
              <option value="newest">
                Newest first
              </option>

              <option value="oldest">
                Oldest first
              </option>

              <option value="az">
                A → Z
              </option>

              <option value="za">
                Z → A
              </option>
            </select>
          </div>
        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="mx-4 mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* =================================================
            PROBLEMS
            ================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {loading && problems.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="
                    h-40
                    animate-pulse
                    rounded-2xl
                    border
                    border-white/5
                    bg-white/[0.025]
                  "
                />
              ))}
            </div>
          ) : filteredProblems.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="max-w-[280px] text-center">
                <div
                  className="
                    mx-auto
                    mb-4
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.035]
                    text-white/35
                  "
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10Z" />
                    <path d="M8 13h8" />
                    <path d="M8 16h5" />
                  </svg>
                </div>

                <h3 className="text-sm font-semibold text-white">
                  {search ||
                  filter !== "all"
                    ? "No matching problems"
                    : "Your workspace is empty"}
                </h3>

                <p className="mt-2 text-xs leading-5 text-white/40">
                  {search ||
                  filter !== "all"
                    ? "Try changing your search or filter."
                    : "Ask KLYRO about a problem and your saved problems will appear here."}
                </p>

                <button
                  type="button"
                  onClick={askAnotherProblem}
                  className="
                    mt-5
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-white
                    px-4
                    py-2.5
                    text-xs
                    font-semibold
                    text-black
                    transition
                    hover:bg-white/90
                  "
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>

                  Ask another problem
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProblems.map(
                (problem) => {
                  const problemId =
                    getProblemId(problem)

                  const title =
                    getProblemTitle(problem)

                  const description =
                    getProblemDescription(
                      problem
                    )

                  const status =
                    getProblemStatus(problem)

                  const date =
                    getProblemDate(problem)

                  const isUpdating =
                    String(
                      updatingProblemId
                    ) === String(problemId)

                  const isDeleting =
                    String(
                      deletingProblemId
                    ) === String(problemId)

                  return (
                    <article
                      key={problemId}
                      className="
                        rounded-2xl
                        border
                        border-white/7
                        bg-white/[0.025]
                        p-4
                        transition
                        hover:border-white/12
                        hover:bg-white/[0.04]
                      "
                    >
                      {/* CARD HEADER */}

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white">
                            {title}
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`
                                rounded-full
                                border
                                px-2
                                py-1
                                text-[10px]
                                font-medium
                                ${getStatusClasses(
                                  status
                                )}
                              `}
                            >
                              {getStatusLabel(
                                status
                              )}
                            </span>

                            {date && (
                              <span className="text-[10px] text-white/30">
                                {formatProblemDate(
                                  date
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={() =>
                            deleteProblem(
                              problemId
                            )
                          }
                          disabled={
                            isDeleting ||
                            isUpdating
                          }
                          aria-label={`Delete ${title}`}
                          title="Delete problem"
                          className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            text-white/25
                            transition
                            hover:bg-red-500/10
                            hover:text-red-300
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                          "
                        >
                          {isDeleting ? (
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="animate-spin"
                            >
                              <circle
                                cx="12"
                                cy="12"
                                r="9"
                                strokeOpacity="0.25"
                              />
                              <path d="M21 12a9 9 0 0 1-9 9" />
                            </svg>
                          ) : (
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 15H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* DESCRIPTION */}

                      <p className="mt-3 line-clamp-3 text-xs leading-5 text-white/45">
                        {description}
                      </p>

                      {/* ACTIONS */}

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            viewProblem(
                              problemId
                            )
                          }
                          disabled={
                            isDeleting ||
                            isUpdating
                          }
                          className="
                            flex
                            flex-1
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-white/10
                            bg-white/5
                            px-3
                            py-2
                            text-xs
                            font-medium
                            text-white/80
                            transition
                            hover:bg-white/10
                            hover:text-white
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                          "
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                            <circle
                              cx="12"
                              cy="12"
                              r="2.5"
                            />
                          </svg>

                          View Guidance
                        </button>

                        {status === "active" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(
                                problemId,
                                "in_progress"
                              )
                            }
                            disabled={
                              isUpdating ||
                              isDeleting
                            }
                            className="
                              rounded-xl
                              border
                              border-amber-400/15
                              bg-amber-500/10
                              px-3
                              py-2
                              text-xs
                              font-medium
                              text-amber-300
                              transition
                              hover:bg-amber-500/15
                              disabled:cursor-not-allowed
                              disabled:opacity-40
                            "
                          >
                            {isUpdating
                              ? "..."
                              : "Start"}
                          </button>
                        )}

                        {(status ===
                          "in_progress" ||
                          status ===
                            "in-progress" ||
                          status ===
                            "inprogress") && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(
                                problemId,
                                "resolved"
                              )
                            }
                            disabled={
                              isUpdating ||
                              isDeleting
                            }
                            className="
                              rounded-xl
                              border
                              border-emerald-400/15
                              bg-emerald-500/10
                              px-3
                              py-2
                              text-xs
                              font-medium
                              text-emerald-300
                              transition
                              hover:bg-emerald-500/15
                              disabled:cursor-not-allowed
                              disabled:opacity-40
                            "
                          >
                            {isUpdating
                              ? "..."
                              : "Resolve"}
                          </button>
                        )}

                        {(status ===
                          "resolved" ||
                          status ===
                            "completed") && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(
                                problemId,
                                "active"
                              )
                            }
                            disabled={
                              isUpdating ||
                              isDeleting
                            }
                            className="
                              rounded-xl
                              border
                              border-blue-400/15
                              bg-blue-500/10
                              px-3
                              py-2
                              text-xs
                              font-medium
                              text-blue-300
                              transition
                              hover:bg-blue-500/15
                              disabled:cursor-not-allowed
                              disabled:opacity-40
                            "
                          >
                            {isUpdating
                              ? "..."
                              : "Reopen"}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                }
              )}
            </div>
          )}
        </div>

        {/* =================================================
            FOOTER
            ================================================= */}

        <div
          className="
            border-t
            border-white/10
            px-5
            py-3
          "
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] text-white/30">
              {stats.total} saved{" "}
              {stats.total === 1
                ? "problem"
                : "problems"}
            </span>

            <button
              type="button"
              onClick={askAnotherProblem}
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-lg
                px-2.5
                py-1.5
                text-[11px]
                font-medium
                text-white/50
                transition
                hover:bg-white/5
                hover:text-white
              "
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>

              Ask another
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}