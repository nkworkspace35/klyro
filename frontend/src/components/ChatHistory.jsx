import { useEffect, useState } from "react"

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

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

    if (value) {
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
        return String(value).replace(/^Bearer\s+/i, "")
      }
    }
  }

  return null
}

function getConversationTitle(conversation) {
  return (
    conversation?.title ||
    conversation?.name ||
    conversation?.conversationTitle ||
    "Untitled conversation"
  )
}

function formatConversationDate(value) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const yesterday = new Date(now)

  yesterday.setDate(now.getDate() - 1)

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isYesterday) {
    return "Yesterday"
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year:
      date.getFullYear() !== now.getFullYear()
        ? "numeric"
        : undefined,
  })
}

function getConversationId(conversation) {
  return (
    conversation?.id ||
    conversation?._id ||
    conversation?.conversationId
  )
}

export default function ChatHistory() {
  const [historyOpen, setHistoryOpen] = useState(false)

  const [conversations, setConversations] = useState([])

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState("")

  const [renamingConversationId, setRenamingConversationId] =
    useState(null)

  const [renameValue, setRenameValue] = useState("")

  const [deletingConversationId, setDeletingConversationId] =
    useState(null)

  const [loadingConversationId, setLoadingConversationId] =
    useState(null)

  async function loadConversations() {
    const token = getToken()

    if (!token) {
      setConversations([])
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/api/conversations`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to load conversations."
        )
      }

      const list =
        Array.isArray(data?.conversations)
          ? data.conversations
          : Array.isArray(data?.data?.conversations)
            ? data.data.conversations
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : []

      setConversations(list)
    } catch (requestError) {
      console.error(
        "KLYRO HISTORY LOAD ERROR:",
        requestError
      )

      setError(
        requestError?.message ||
          "Unable to load conversation history."
      )
    } finally {
      setLoading(false)
    }
  }

  function openHistory() {
    setHistoryOpen(true)
    loadConversations()
  }

  function closeHistory() {
    setHistoryOpen(false)
    setRenamingConversationId(null)
    setRenameValue("")
    setError("")
  }

  function openWorkspace() {
    /*
      Workspace is intentionally NOT inside the History drawer.

      This event is handled by App.jsx, which opens
      WorkspaceSidebar as a separate side panel.
    */

    setHistoryOpen(false)

    setRenamingConversationId(null)
    setRenameValue("")

    window.dispatchEvent(
      new CustomEvent("klyro-workspace-open")
    )
  }

  function newChat() {
    window.dispatchEvent(
      new CustomEvent("klyro-new-chat")
    )

    closeHistory()
  }

  async function loadConversation(conversationId) {
    if (!conversationId) {
      return
    }

    const token = getToken()

    if (!token) {
      setError("Please login again.")
      return
    }

    setLoadingConversationId(conversationId)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/api/conversations/${conversationId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to load conversation."
        )
      }

      const conversation =
        data?.conversation ||
        data?.data ||
        data

      window.dispatchEvent(
        new CustomEvent("klyro-conversation-load", {
          detail: {
            conversation,
          },
        })
      )

      closeHistory()
    } catch (requestError) {
      console.error(
        "KLYRO CONVERSATION LOAD ERROR:",
        requestError
      )

      setError(
        requestError?.message ||
          "Unable to open this conversation."
      )
    } finally {
      setLoadingConversationId(null)
    }
  }

  function startRename(conversation) {
    const conversationId =
      getConversationId(conversation)

    if (!conversationId) {
      return
    }

    setRenamingConversationId(conversationId)

    setRenameValue(
      getConversationTitle(conversation)
    )

    setError("")
  }

  function cancelRename() {
    setRenamingConversationId(null)
    setRenameValue("")
  }

  async function renameConversation(conversationId) {
    const title = renameValue.trim()

    if (!conversationId || !title) {
      return
    }

    const token = getToken()

    if (!token) {
      setError("Please login again.")
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/api/conversations/${conversationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
          }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to rename conversation."
        )
      }

      setConversations((current) =>
        current.map((conversation) => {
          const id = getConversationId(conversation)

          if (String(id) !== String(conversationId)) {
            return conversation
          }

          return {
            ...conversation,
            title,
          }
        })
      )

      cancelRename()

      window.dispatchEvent(
        new CustomEvent("klyro-conversations-refresh")
      )
    } catch (requestError) {
      console.error(
        "KLYRO RENAME ERROR:",
        requestError
      )

      setError(
        requestError?.message ||
          "Unable to rename conversation."
      )
    }
  }

  async function deleteConversation(conversationId) {
    if (!conversationId) {
      return
    }

    const confirmed = window.confirm(
      "Delete this conversation?"
    )

    if (!confirmed) {
      return
    }

    const token = getToken()

    if (!token) {
      setError("Please login again.")
      return
    }

    setDeletingConversationId(conversationId)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/api/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to delete conversation."
        )
      }

      setConversations((current) =>
        current.filter(
          (conversation) =>
            String(getConversationId(conversation)) !==
            String(conversationId)
        )
      )

      window.dispatchEvent(
        new CustomEvent("klyro-conversation-deleted", {
          detail: {
            conversationId,
          },
        })
      )

      window.dispatchEvent(
        new CustomEvent("klyro-conversations-refresh")
      )
    } catch (requestError) {
      console.error(
        "KLYRO DELETE CONVERSATION ERROR:",
        requestError
      )

      setError(
        requestError?.message ||
          "Unable to delete conversation."
      )
    } finally {
      setDeletingConversationId(null)
    }
  }

  useEffect(() => {
    function handleEscape(event) {
      if (
        event.key === "Escape" &&
        historyOpen
      ) {
        closeHistory()
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
  }, [historyOpen])

  useEffect(() => {
    function handleAuthChange() {
      const token = getToken()

      if (!token) {
        setConversations([])
        closeHistory()
        return
      }

      loadConversations()
    }

    function handleConversationRefresh() {
      if (getToken()) {
        loadConversations()
      }
    }

    window.addEventListener(
      "klyro-auth-change",
      handleAuthChange
    )

    window.addEventListener(
      "klyro-conversations-refresh",
      handleConversationRefresh
    )

    return () => {
      window.removeEventListener(
        "klyro-auth-change",
        handleAuthChange
      )

      window.removeEventListener(
        "klyro-conversations-refresh",
        handleConversationRefresh
      )
    }
  }, [])

  useEffect(() => {
    if (getToken()) {
      loadConversations()
    }
  }, [])

  return (
    <>
      {/* =====================================================
          RIGHT SIDE NAVIGATION
          ===================================================== */}

      <div
        className="
          fixed
          right-4
          top-1/2
          z-[100]
          flex
          -translate-y-1/2
          flex-col
          gap-2
        "
      >
        {/* HISTORY BUTTON */}

        <button
          type="button"
          onClick={openHistory}
          aria-label="Open history"
          title="History"
          className="
            group
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            border
            border-white/10
            bg-[#11131A]/95
            text-white
            shadow-[0_12px_40px_rgba(0,0,0,0.35)]
            backdrop-blur-xl
            transition
            duration-200
            hover:border-white/20
            hover:bg-[#181B24]
            hover:scale-105
            focus:outline-none
            focus:ring-2
            focus:ring-white/20
          "
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v6h6" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>

        {/* =================================================
            YOUR WORKSPACE BUTTON

            IMPORTANT:
            This is a SEPARATE button.
            It is NOT inside the History drawer.
            ================================================= */}

        <button
          type="button"
          onClick={openWorkspace}
          aria-label="Open your workspace"
          title="Your Workspace"
          className="
            group
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            border
            border-white/10
            bg-[#11131A]/95
            text-white
            shadow-[0_12px_40px_rgba(0,0,0,0.35)]
            backdrop-blur-xl
            transition
            duration-200
            hover:border-white/20
            hover:bg-[#181B24]
            hover:scale-105
            focus:outline-none
            focus:ring-2
            focus:ring-white/20
          "
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10Z" />
            <path d="M3 10h18" />
          </svg>
        </button>
      </div>

      {/* =====================================================
          HISTORY OVERLAY
          ===================================================== */}

      {historyOpen && (
        <div
          className="
            fixed
            inset-0
            z-[110]
            bg-black/50
            backdrop-blur-[2px]
          "
          onClick={closeHistory}
        />
      )}

      {/* =====================================================
          HISTORY DRAWER
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
          max-w-[420px]
          flex-col
          border-l
          border-white/10
          bg-[#0B0D12]
          shadow-[-20px_0_80px_rgba(0,0,0,0.45)]
          transition-transform
          duration-300
          ease-out
          ${
            historyOpen
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
        aria-hidden={!historyOpen}
      >
        {/* =================================================
            DRAWER HEADER
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
          <div>
            <h2 className="text-lg font-semibold text-white">
              History
            </h2>

            <p className="mt-0.5 text-xs text-white/45">
              Your previous KLYRO conversations
            </p>
          </div>

          <button
            type="button"
            onClick={closeHistory}
            aria-label="Close history"
            title="Close"
            className="
              flex
              h-9
              w-9
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
            DRAWER ACTIONS
            ================================================= */}

        <div
          className="
            flex
            items-center
            gap-2
            border-b
            border-white/10
            px-5
            py-3
          "
        >
          <button
            type="button"
            onClick={newChat}
            className="
              flex
              flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-black
              transition
              hover:bg-white/90
            "
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>

            New Chat
          </button>

          <button
            type="button"
            onClick={loadConversations}
            disabled={loading}
            aria-label="Refresh history"
            title="Refresh"
            className="
              flex
              h-10
              w-10
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
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            >
              <path d="M20 11a8.1 8.1 0 0 0-14.9-4" />
              <path d="M4 4v5h5" />
              <path d="M4 13a8.1 8.1 0 0 0 14.9 4" />
              <path d="M20 20v-5h-5" />
            </svg>
          </button>
        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="mx-5 mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
            {error}
          </div>
        )}

        {/* =================================================
            CONVERSATION LIST
            ================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          {loading && conversations.length === 0 ? (
            <div className="flex flex-col gap-2 px-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="
                    h-16
                    animate-pulse
                    rounded-xl
                    border
                    border-white/5
                    bg-white/[0.03]
                  "
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-full min-h-[280px] items-center justify-center px-6 text-center">
              <div>
                <div
                  className="
                    mx-auto
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.04]
                    text-white/40
                  "
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
                  </svg>
                </div>

                <h3 className="text-sm font-semibold text-white">
                  No conversations yet
                </h3>

                <p className="mt-1 text-xs leading-5 text-white/40">
                  Start a conversation with KLYRO
                  and it will appear here.
                </p>

                <button
                  type="button"
                  onClick={newChat}
                  className="
                    mt-4
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-2
                    text-xs
                    font-medium
                    text-white
                    transition
                    hover:bg-white/10
                  "
                >
                  Start New Chat
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const conversationId =
                  getConversationId(conversation)

                const title =
                  getConversationTitle(conversation)

                const dateValue =
                  conversation?.updatedAt ||
                  conversation?.updated_at ||
                  conversation?.createdAt ||
                  conversation?.created_at

                const isRenaming =
                  String(
                    renamingConversationId
                  ) === String(conversationId)

                const isDeleting =
                  String(
                    deletingConversationId
                  ) === String(conversationId)

                const isLoading =
                  String(
                    loadingConversationId
                  ) === String(conversationId)

                return (
                  <div
                    key={
                      conversationId ||
                      createId()
                    }
                    className="
                      group
                      rounded-xl
                      border
                      border-white/5
                      bg-white/[0.025]
                      p-2
                      transition
                      hover:border-white/10
                      hover:bg-white/[0.045]
                    "
                  >
                    {isRenaming ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault()

                          renameConversation(
                            conversationId
                          )
                        }}
                        className="p-1"
                      >
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(event) =>
                            setRenameValue(
                              event.target.value
                            )
                          }
                          autoFocus
                          maxLength={120}
                          className="
                            w-full
                            rounded-lg
                            border
                            border-white/10
                            bg-black/20
                            px-3
                            py-2
                            text-sm
                            text-white
                            outline-none
                            placeholder:text-white/25
                            focus:border-white/25
                          "
                          placeholder="Conversation title"
                        />

                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelRename}
                            className="
                              rounded-lg
                              px-3
                              py-1.5
                              text-xs
                              text-white/50
                              transition
                              hover:bg-white/5
                              hover:text-white
                            "
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            disabled={
                              !renameValue.trim()
                            }
                            className="
                              rounded-lg
                              bg-white
                              px-3
                              py-1.5
                              text-xs
                              font-semibold
                              text-black
                              transition
                              hover:bg-white/90
                              disabled:cursor-not-allowed
                              disabled:opacity-40
                            "
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            loadConversation(
                              conversationId
                            )
                          }
                          disabled={
                            isLoading ||
                            isDeleting
                          }
                          className="
                            min-w-0
                            flex-1
                            rounded-lg
                            px-2
                            py-2
                            text-left
                            transition
                            hover:bg-white/5
                            disabled:cursor-not-allowed
                          "
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                bg-white/5
                                text-white/50
                              "
                            >
                              {isLoading ? (
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
                                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
                                </svg>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-white/90">
                                {title}
                              </div>

                              <div className="mt-0.5 text-[11px] text-white/35">
                                {formatConversationDate(
                                  dateValue
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        <div
                          className="
                            flex
                            shrink-0
                            items-center
                            gap-0.5
                          "
                        >
                          <button
                            type="button"
                            onClick={() =>
                              startRename(
                                conversation
                              )
                            }
                            disabled={
                              isDeleting ||
                              isLoading
                            }
                            aria-label={`Rename ${title}`}
                            title="Rename"
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-lg
                              text-white/30
                              opacity-0
                              transition
                              group-hover:opacity-100
                              hover:bg-white/10
                              hover:text-white
                              disabled:cursor-not-allowed
                              disabled:opacity-20
                            "
                          >
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
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteConversation(
                                conversationId
                              )
                            }
                            disabled={
                              isDeleting ||
                              isLoading
                            }
                            aria-label={`Delete ${title}`}
                            title="Delete"
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-lg
                              text-white/30
                              opacity-0
                              transition
                              group-hover:opacity-100
                              hover:bg-red-500/10
                              hover:text-red-300
                              disabled:cursor-not-allowed
                              disabled:opacity-20
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
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* =================================================
            DRAWER FOOTER

            NOTE:
            Workspace button is deliberately NOT here.
            Workspace has its own fixed side-navigation button.
            ================================================= */}

        <div
          className="
            border-t
            border-white/10
            px-5
            py-3
          "
        >
          <div className="flex items-center justify-between text-[11px] text-white/30">
            <span>
              {conversations.length}{" "}
              {conversations.length === 1
                ? "conversation"
                : "conversations"}
            </span>

            <span>KLYRO</span>
          </div>
        </div>
      </aside>
    </>
  )
}