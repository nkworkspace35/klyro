import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import Navbar from "../components/Navbar"

function ProblemDetails() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [problem, setProblem] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deletingProblem, setDeletingProblem] = useState(false)

  const [editingProblem, setEditingProblem] = useState(false)
  const [savingProblem, setSavingProblem] = useState(false)

  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const [regeneratingAI, setRegeneratingAI] =
    useState(false)

  const [actions, setActions] = useState([])
  const [updatingAction, setUpdatingAction] =
    useState(null)

  /*
   * FETCH PROBLEM
   */
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const token =
          localStorage.getItem("klyro_token")

        if (!token) {
          navigate("/login", {
            replace: true,
          })
          return
        }

        setLoading(true)
        setError("")

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/problems/${id}`,
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
            data.message ||
              "Unable to load problem."
          )
          return
        }

        setProblem(data.problem)

        setActions(
          data.problem.actions || []
        )

        setEditTitle(
          data.problem.title || ""
        )

        setEditDescription(
          data.problem.description || ""
        )
      } catch (error) {
        setError(
          "Unable to connect to the server."
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProblem()
  }, [id, navigate])

  /*
   * ACTION PROGRESS
   */
  const completedActions = useMemo(() => {
    return actions.filter(
      (action) => action.completed
    ).length
  }, [actions])

  const actionProgress = useMemo(() => {
    if (actions.length === 0) {
      return 0
    }

    return Math.round(
      (completedActions / actions.length) * 100
    )
  }, [actions.length, completedActions])

  /*
   * START EDITING
   */
  const handleStartEditing = () => {
    if (
      !problem ||
      deletingProblem ||
      updatingStatus ||
      regeneratingAI ||
      updatingAction
    ) {
      return
    }

    setError("")
    setSuccessMessage("")

    setEditTitle(
      problem.title || ""
    )

    setEditDescription(
      problem.description || ""
    )

    setEditingProblem(true)
  }

  /*
   * CANCEL EDITING
   */
  const handleCancelEditing = () => {
    if (savingProblem) {
      return
    }

    setEditTitle(
      problem.title || ""
    )

    setEditDescription(
      problem.description || ""
    )

    setEditingProblem(false)
    setError("")
  }

  /*
   * SAVE EDITED PROBLEM
   */
  const handleSaveProblem = async () => {
    if (
      !problem ||
      savingProblem ||
      deletingProblem ||
      regeneratingAI
    ) {
      return
    }

    setError("")
    setSuccessMessage("")

    if (!editDescription.trim()) {
      setError(
        "Problem description is required."
      )
      return
    }

    try {
      setSavingProblem(true)

      const token =
        localStorage.getItem("klyro_token")

      if (!token) {
        navigate("/login", {
          replace: true,
        })
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/problems/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title:
              editTitle.trim() ||
              "Untitled problem",
            description:
              editDescription.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to update problem."
        )
        return
      }

      setProblem(data.problem)

      setActions([])

      setEditTitle(
        data.problem.title || ""
      )

      setEditDescription(
        data.problem.description || ""
      )

      setEditingProblem(false)

      setSuccessMessage(
        "Problem updated. Generate a fresh AI solution."
      )
    } catch (error) {
      setError(
        "Unable to connect to the server."
      )
    } finally {
      setSavingProblem(false)
    }
  }

  /*
   * REGENERATE AI
   */
  const handleRegenerateAI = async () => {
    if (
      !problem ||
      regeneratingAI ||
      savingProblem ||
      deletingProblem ||
      editingProblem ||
      updatingStatus ||
      updatingAction
    ) {
      return
    }

    try {
      setError("")
      setSuccessMessage("")
      setRegeneratingAI(true)

      const token =
        localStorage.getItem("klyro_token")

      if (!token) {
        navigate("/login", {
          replace: true,
        })
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/solve-problem`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            problemId: problem.id,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to generate AI solution."
        )
        return
      }

      if (data.problem) {
        setProblem(data.problem)

        setActions(
          data.problem.actions || []
        )
      }

      setSuccessMessage(
        "Fresh AI solution generated successfully."
      )
    } catch (error) {
      setError(
        "Unable to connect to the server."
      )
    } finally {
      setRegeneratingAI(false)
    }
  }

  /*
   * UPDATE PROBLEM STATUS
   */
  const handleStatusChange = async (
    newStatus
  ) => {
    if (
      !problem ||
      updatingStatus ||
      deletingProblem ||
      editingProblem ||
      regeneratingAI ||
      updatingAction
    ) {
      return
    }

    if (
      problem.status === newStatus
    ) {
      return
    }

    try {
      setError("")
      setSuccessMessage("")
      setUpdatingStatus(true)

      const token =
        localStorage.getItem("klyro_token")

      if (!token) {
        navigate("/login", {
          replace: true,
        })
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/problems/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to update problem status."
        )
        return
      }

      setProblem((current) => ({
        ...current,
        ...data.problem,
        actions: actions,
      }))

      setSuccessMessage(
        "Problem status updated."
      )
    } catch (error) {
      setError(
        "Unable to update problem status."
      )
    } finally {
      setUpdatingStatus(false)
    }
  }

  /*
   * DELETE PROBLEM
   */
  const handleDeleteProblem = async () => {
    if (
      !problem ||
      deletingProblem ||
      editingProblem ||
      regeneratingAI ||
      updatingAction
    ) {
      return
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this problem? This action cannot be undone."
    )

    if (!confirmed) {
      return
    }

    try {
      setError("")
      setSuccessMessage("")
      setDeletingProblem(true)

      const token =
        localStorage.getItem("klyro_token")

      if (!token) {
        navigate("/login", {
          replace: true,
        })
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/problems/${id}`,
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
          data.message ||
            "Unable to delete problem."
        )
        return
      }

      window.dispatchEvent(
        new Event(
          "klyro-problems-refresh"
        )
      )

      navigate("/", {
        replace: true,
      })
    } catch (error) {
      setError(
        "Unable to connect to the server."
      )
    } finally {
      setDeletingProblem(false)
    }
  }

  /*
   * TOGGLE CHECKLIST ACTION
   */
  const handleToggleAction = async (
    actionId
  ) => {
    if (
      !problem ||
      updatingAction ||
      regeneratingAI ||
      savingProblem ||
      deletingProblem ||
      updatingStatus
    ) {
      return
    }

    try {
      setError("")
      setSuccessMessage("")
      setUpdatingAction(actionId)

      const token =
        localStorage.getItem("klyro_token")

      if (!token) {
        navigate("/login", {
          replace: true,
        })
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/problems/${problem.id}/actions/${actionId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to update action."
        )
        return
      }

      setActions((current) =>
        current.map((action) =>
          action.id === actionId
            ? data.action
            : action
        )
      )
    } catch (error) {
      setError(
        "Unable to connect to the server."
      )
    } finally {
      setUpdatingAction(null)
    }
  }

  /*
   * STATUS LABEL
   */
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

  /*
   * CATEGORY LABEL
   */
  const getCategoryLabel = (
    category
  ) => {
    const categories = {
      career: "Career",
      education: "Education",
      work: "Work",
      finance: "Finance",
      personal: "Personal",
      technology: "Technology",
      other: "Other",
    }

    return (
      categories[category] ||
      "Other"
    )
  }

  /*
   * PRIORITY LABEL
   */
  const getPriorityLabel = (
    priority
  ) => {
    if (priority === "high") {
      return "High priority"
    }

    if (priority === "low") {
      return "Low priority"
    }

    return "Medium priority"
  }

  /*
   * PRIORITY STYLE
   */
  const getPriorityStyle = (
    priority
  ) => {
    if (priority === "high") {
      return "border-rose-400/20 bg-rose-400/10 text-rose-300"
    }

    if (priority === "low") {
      return "border-slate-400/20 bg-slate-400/10 text-slate-300"
    }

    return "border-amber-400/20 bg-amber-400/10 text-amber-300"
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090D] text-white">
        <Navbar />

        <main className="mx-auto max-w-5xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">

            <div className="flex items-center gap-3">

              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-violet-400" />

              <p className="text-sm text-slate-400">
                Loading problem...
              </p>

            </div>

          </div>

        </main>
      </div>
    )
  }

  /*
   * ERROR WITHOUT PROBLEM
   */
  if (error && !problem) {
    return (
      <div className="min-h-screen bg-[#08090D] text-white">
        <Navbar />

        <main className="mx-auto max-w-5xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() =>
              navigate("/")
            }
            className="mb-6 text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to KLYRO
          </button>

          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-6">

            <p className="text-sm text-rose-300">
              {error}
            </p>

          </div>

        </main>
      </div>
    )
  }

  /*
   * MAIN PAGE
   */
  return (
    <div className="min-h-screen bg-[#08090D] text-white">

      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">

        {/* BACK */}
        <button
          type="button"
          onClick={() =>
            navigate("/")
          }
          className="mb-8 text-sm text-slate-500 transition hover:text-white"
        >
          ← Back to KLYRO
        </button>

        {/* PROBLEM HEADER */}
        <section className="mb-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

            <div className="min-w-0 flex-1">

              <p className="text-sm font-medium text-violet-400">
                Problem
              </p>

              {!editingProblem && (
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {problem.title ||
                    "Untitled problem"}
                </h1>
              )}

              {editingProblem && (
                <div className="mt-4">

                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) =>
                      setEditTitle(
                        e.target.value
                      )
                    }
                    placeholder="Problem title"
                    disabled={
                      savingProblem
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#0D0F15] px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 disabled:opacity-60"
                  />

                </div>
              )}

              {!editingProblem && (
                <div className="mt-4 flex flex-wrap items-center gap-2">

                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-400">
                    {getCategoryLabel(
                      problem.category
                    )}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${getPriorityStyle(
                      problem.priority
                    )}`}
                  >
                    {getPriorityLabel(
                      problem.priority
                    )}
                  </span>

                </div>
              )}

            </div>

            <div className="flex flex-wrap items-center gap-2">

              <span
                className={`w-fit rounded-full px-3 py-1 text-xs ${
                  problem.status ===
                  "resolved"
                    ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : problem.status ===
                      "in_progress"
                    ? "border border-violet-400/20 bg-violet-400/10 text-violet-300"
                    : "border border-amber-400/20 bg-amber-400/10 text-amber-300"
                }`}
              >
                {getStatusLabel(
                  problem.status
                )}
              </span>

              {!editingProblem && (
                <button
                  type="button"
                  disabled={
                    deletingProblem ||
                    updatingStatus ||
                    regeneratingAI ||
                    updatingAction
                  }
                  onClick={
                    handleStartEditing
                  }
                  className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Edit
                </button>
              )}

              <button
                type="button"
                disabled={
                  deletingProblem ||
                  updatingStatus ||
                  editingProblem ||
                  regeneratingAI ||
                  updatingAction
                }
                onClick={
                  handleDeleteProblem
                }
                className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-400/20 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingProblem
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </section>

        {/* EDIT */}
        {editingProblem && (
          <section className="mb-8">

            <div className="rounded-3xl border border-violet-400/20 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">

              <div className="mb-4">

                <p className="text-sm font-semibold text-white">
                  Edit your problem
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Update the details of your problem.
                </p>

              </div>

              <textarea
                value={editDescription}
                onChange={(e) =>
                  setEditDescription(
                    e.target.value
                  )
                }
                placeholder="Describe your problem..."
                rows="8"
                disabled={
                  savingProblem
                }
                className="w-full resize-none rounded-2xl border border-white/10 bg-[#0D0F15] px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 disabled:opacity-60"
              />

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  disabled={
                    savingProblem
                  }
                  onClick={
                    handleCancelEditing
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    savingProblem ||
                    !editDescription.trim()
                  }
                  onClick={
                    handleSaveProblem
                  }
                  className="rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingProblem
                    ? "Saving..."
                    : "Save changes"}
                </button>

              </div>

            </div>

          </section>
        )}

        {/* SUCCESS */}
        {successMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">

            <p className="text-sm text-emerald-300">
              {successMessage}
            </p>

          </div>
        )}

        {/* STATUS */}
        <section className="mb-8">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">

            <div className="mb-4">

              <p className="text-sm font-semibold text-white">
                Problem status
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Track where you currently are with this problem.
              </p>

            </div>

            <div className="grid gap-2 sm:grid-cols-3">

              {/* ACTIVE */}
              <button
                type="button"
                disabled={
                  updatingStatus ||
                  deletingProblem ||
                  editingProblem ||
                  regeneratingAI ||
                  updatingAction
                }
                onClick={() =>
                  handleStatusChange(
                    "active"
                  )
                }
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  problem.status ===
                  "active"
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >

                <div className="flex items-center gap-2">

                  <span
                    className={`h-2 w-2 rounded-full ${
                      problem.status ===
                      "active"
                        ? "bg-amber-400"
                        : "bg-slate-600"
                    }`}
                  />

                  <span className="text-sm font-medium">
                    Active
                  </span>

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  I haven't started yet
                </p>

              </button>

              {/* IN PROGRESS */}
              <button
                type="button"
                disabled={
                  updatingStatus ||
                  deletingProblem ||
                  editingProblem ||
                  regeneratingAI ||
                  updatingAction
                }
                onClick={() =>
                  handleStatusChange(
                    "in_progress"
                  )
                }
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  problem.status ===
                  "in_progress"
                    ? "border-violet-400/30 bg-violet-400/10 text-violet-300"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >

                <div className="flex items-center gap-2">

                  <span
                    className={`h-2 w-2 rounded-full ${
                      problem.status ===
                      "in_progress"
                        ? "bg-violet-400"
                        : "bg-slate-600"
                    }`}
                  />

                  <span className="text-sm font-medium">
                    In progress
                  </span>

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  I'm working on it
                </p>

              </button>

              {/* RESOLVED */}
              <button
                type="button"
                disabled={
                  updatingStatus ||
                  deletingProblem ||
                  editingProblem ||
                  regeneratingAI ||
                  updatingAction
                }
                onClick={() =>
                  handleStatusChange(
                    "resolved"
                  )
                }
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  problem.status ===
                  "resolved"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >

                <div className="flex items-center gap-2">

                  <span
                    className={`h-2 w-2 rounded-full ${
                      problem.status ===
                      "resolved"
                        ? "bg-emerald-400"
                        : "bg-slate-600"
                    }`}
                  />

                  <span className="text-sm font-medium">
                    Resolved
                  </span>

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Problem is solved
                </p>

              </button>

            </div>

            {updatingStatus && (
              <p className="mt-3 text-xs text-slate-500">
                Updating status...
              </p>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3">

                <p className="text-xs text-rose-300">
                  {error}
                </p>

              </div>
            )}

          </div>

        </section>

        {/* USER PROBLEM */}
        <section className="mb-8">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-slate-300">
                ?
              </div>

              <div>

                <p className="text-sm font-semibold text-white">
                  Your problem
                </p>

                <p className="text-xs text-slate-500">
                  What you told KLYRO
                </p>

              </div>

            </div>

            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {problem.description}
            </p>

          </div>

        </section>

        {/* AI SECTION */}
        <section className="mb-8">

          <div className="rounded-3xl border border-violet-400/20 bg-violet-500/[0.05] p-5 shadow-2xl shadow-violet-950/10 backdrop-blur-xl sm:p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-lg text-violet-300">
                    ✦
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-white">
                      AI solution
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Generate a fresh solution based on your current problem.
                    </p>

                  </div>

                </div>

              </div>

              <button
                type="button"
                disabled={
                  regeneratingAI ||
                  savingProblem ||
                  deletingProblem ||
                  editingProblem ||
                  updatingStatus ||
                  updatingAction
                }
                onClick={
                  handleRegenerateAI
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {regeneratingAI ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    ✦ Regenerate AI
                  </>
                )}

              </button>

            </div>

            {regeneratingAI && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">

                <p className="text-xs leading-5 text-slate-400">
                  KLYRO is analyzing your problem again and creating a fresh action plan. This may take a few seconds.
                </p>

              </div>
            )}

          </div>

        </section>

        {/* AI SOLUTION */}
        {problem.ai_solution && (
          <section className="space-y-5">

            {/* AI HEADER */}
            <div className="overflow-hidden rounded-3xl border border-violet-400/20 bg-white/[0.04] shadow-2xl shadow-violet-950/20 backdrop-blur-xl">

              <div className="border-b border-white/10 bg-violet-500/[0.06] px-5 py-5 sm:px-8">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-lg text-violet-300">
                    ✦
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-white">
                      KLYRO's solution
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Your next move starts here.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* KEY ISSUE */}
            {problem.ai_solution.key_issue && (
              <div className="rounded-3xl border border-violet-400/10 bg-violet-500/[0.04] p-6 backdrop-blur-xl sm:p-8">

                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                    !
                  </div>

                  <h2 className="text-lg font-semibold text-white">
                    Key issue
                  </h2>

                </div>

                <p className="text-sm leading-7 text-slate-300">
                  {problem.ai_solution.key_issue}
                </p>

              </div>
            )}

            {/* WHAT IS HAPPENING */}
            {problem.ai_solution
              .what_is_happening && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">

                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                    ?
                  </div>

                  <h2 className="text-lg font-semibold text-white">
                    What's happening
                  </h2>

                </div>

                <p className="text-sm leading-7 text-slate-300">
                  {
                    problem.ai_solution
                      .what_is_happening
                  }
                </p>

              </div>
            )}

            {/* WHY */}
            {problem.ai_solution
              .why_this_may_be_happening
              ?.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">

                <div className="mb-5 flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                    🔍
                  </div>

                  <h2 className="text-lg font-semibold text-white">
                    Why this may be happening
                  </h2>

                </div>

                <div className="space-y-3">

                  {problem.ai_solution
                    .why_this_may_be_happening
                    .map(
                      (
                        reason,
                        index
                      ) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >

                          <div className="flex gap-3">

                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-medium text-violet-300">
                              {index + 1}
                            </span>

                            <p className="text-sm leading-6 text-slate-300">
                              {reason}
                            </p>

                          </div>

                        </div>
                      )
                    )}

                </div>

              </div>
            )}

            {/* WHAT TO DO NEXT */}
            {problem.ai_solution
              .what_to_do_next
              ?.length > 0 && (
              <div className="rounded-3xl border border-emerald-400/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">

                <div className="mb-5 flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                    →
                  </div>

                  <h2 className="text-lg font-semibold text-white">
                    What to do next
                  </h2>

                </div>

                <div className="space-y-3">

                  {problem.ai_solution
                    .what_to_do_next
                    .map(
                      (
                        action,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >

                          <span className="text-emerald-400">
                            ✓
                          </span>

                          <p className="text-sm leading-6 text-slate-300">
                            {action}
                          </p>

                        </div>
                      )
                    )}

                </div>

              </div>
            )}

            {/* ACTION CHECKLIST */}
            {actions.length > 0 && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  <div>

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                        ✓
                      </div>

                      <div>

                        <h2 className="text-lg font-semibold text-white">
                          Your action plan
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                          Complete these steps to move the problem forward.
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="text-left sm:text-right">

                    <p className="text-2xl font-semibold text-white">
                      {completedActions}/
                      {actions.length}
                    </p>

                    <p className="text-xs text-slate-500">
                      completed
                    </p>

                  </div>

                </div>

                {/* PROGRESS */}
                <div className="mb-6">

                  <div className="mb-2 flex items-center justify-between text-xs">

                    <span className="text-slate-500">
                      Progress
                    </span>

                    <span className="font-medium text-violet-300">
                      {actionProgress}%
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">

                    <div
                      className="h-full rounded-full bg-violet-500 transition-all duration-500"
                      style={{
                        width: `${actionProgress}%`,
                      }}
                    />

                  </div>

                </div>

                {/* ACTIONS */}
                <div className="space-y-3">

                  {actions.map(
                    (action) => (
                      <button
                        key={action.id}
                        type="button"
                        disabled={
                          updatingAction !==
                            null &&
                          updatingAction !==
                            action.id
                        }
                        onClick={() =>
                          handleToggleAction(
                            action.id
                          )
                        }
                        className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                          action.completed
                            ? "border-emerald-400/20 bg-emerald-400/[0.06]"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >

                        <span
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                            action.completed
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                              : "border-white/10 bg-white/[0.04] text-slate-500"
                          }`}
                        >
                          {updatingAction ===
                          action.id ? (
                            <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-violet-400" />
                          ) : action.completed ? (
                            "✓"
                          ) : (
                            action.step_number
                          )}
                        </span>

                        <div className="min-w-0 flex-1">

                          <h3
                            className={`text-sm font-semibold ${
                              action.completed
                                ? "text-emerald-300 line-through"
                                : "text-white"
                            }`}
                          >
                            {action.title}
                          </h3>

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

                        </div>

                      </button>
                    )
                  )}

                </div>

                {actionProgress ===
                  100 && (
                  <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">

                    <p className="text-sm font-medium text-emerald-300">
                      All actions completed. Nice work.
                    </p>

                    <p className="mt-1 text-xs text-emerald-300/60">
                      If the problem is solved, you can mark it as resolved above.
                    </p>

                  </div>
                )}

              </section>
            )}

            {/* WHAT TO AVOID */}
            {problem.ai_solution
              .what_to_avoid
              ?.length > 0 && (
              <div className="rounded-3xl border border-rose-400/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">

                <div className="mb-5 flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300">
                    ×
                  </div>

                  <h2 className="text-lg font-semibold text-white">
                    What to avoid
                  </h2>

                </div>

                <div className="space-y-3">

                  {problem.ai_solution
                    .what_to_avoid
                    .map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={index}
                          className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >

                          <span className="text-rose-400">
                            ×
                          </span>

                          <p className="text-sm leading-6 text-slate-300">
                            {item}
                          </p>

                        </div>
                      )
                    )}

                </div>

              </div>
            )}

            {/* SUMMARY */}
            {problem.ai_solution
              .summary && (
              <div className="rounded-3xl border border-violet-400/20 bg-violet-500/[0.05] p-6 shadow-2xl shadow-violet-950/10 sm:p-8">

                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                    ✦
                  </div>

                  <h2 className="text-lg font-semibold text-white">
                    Summary
                  </h2>

                </div>

                <p className="text-sm leading-7 text-slate-300">
                  {
                    problem.ai_solution
                      .summary
                  }
                </p>

              </div>
            )}

          </section>
        )}

        {/* OLD AI RESPONSE FALLBACK */}
        {!problem.ai_solution &&
          problem.ai_response && (
            <section>

              <div className="overflow-hidden rounded-3xl border border-violet-400/20 bg-white/[0.04] shadow-2xl shadow-violet-950/20 backdrop-blur-xl">

                <div className="border-b border-white/10 bg-violet-500/[0.06] px-5 py-5 sm:px-8">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-lg text-violet-300">
                      ✦
                    </div>

                    <div>

                      <p className="text-sm font-semibold text-white">
                        KLYRO's solution
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Your next move starts here.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="px-5 py-7 sm:px-8 sm:py-8">

                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                    {problem.ai_response}
                  </div>

                </div>

              </div>

            </section>
          )}

        {/* NO AI SOLUTION */}
        {!problem.ai_solution &&
          !problem.ai_response && (
            <section>

              <div className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.05] p-6">

                <p className="text-sm font-medium text-amber-300">
                  KLYRO is ready to generate a fresh solution.
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Click "Regenerate AI" above to analyze this problem.
                </p>

              </div>

            </section>
          )}

      </main>
    </div>
  )
}

export default ProblemDetails