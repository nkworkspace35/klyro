import {
  useEffect,
  useState,
} from "react"
import {
  useNavigate,
  Link,
} from "react-router-dom"

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"

export default function Login({
  open: controlledOpen,
  onClose,
  onSwitchToSignup,
}) {
  const navigate = useNavigate()

  const [
    internalOpen,
    setInternalOpen,
  ] = useState(true)

  const isControlled =
    typeof controlledOpen ===
    "boolean"

  const open = isControlled
    ? controlledOpen
    : internalOpen

  const [
    email,
    setEmail,
  ] = useState("")

  const [
    password,
    setPassword,
  ] = useState("")

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  /*
  ========================================================
  OPEN/CLOSE EVENTS
  ========================================================
  */

  useEffect(() => {
    function handleOpen() {
      if (!isControlled) {
        setInternalOpen(true)
      }
    }

    function handleClose() {
      if (!isControlled) {
        setInternalOpen(false)
      }

      onClose?.()
    }

    window.addEventListener(
      "klyro-open-login",
      handleOpen
    )

    window.addEventListener(
      "klyro-close-auth",
      handleClose
    )

    return () => {
      window.removeEventListener(
        "klyro-open-login",
        handleOpen
      )

      window.removeEventListener(
        "klyro-close-auth",
        handleClose
      )
    }
  }, [isControlled, onClose])

  /*
  ========================================================
  ESC
  ========================================================
  */

  useEffect(() => {
    if (!open) {
      return
    }

    function handleEscape(event) {
      if (
        event.key === "Escape"
      ) {
        closePanel()
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
  }, [open])

  /*
  ========================================================
  CLOSE
  ========================================================
  */

  function closePanel() {
    if (!isControlled) {
      setInternalOpen(false)
    }

    onClose?.()
  }

  /*
  ========================================================
  SWITCH SIGNUP
  ========================================================
  */

  function switchToSignup() {
    if (onSwitchToSignup) {
      onSwitchToSignup()
      return
    }

    window.dispatchEvent(
      new Event(
        "klyro-open-signup"
      )
    )
  }

  /*
  ========================================================
  LOGIN
  ========================================================
  */

  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    setError("")

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "Please enter your email and password."
      )

      return
    }

    setLoading(true)

    try {
      const response =
        await fetch(
          `${API_URL}/api/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                email:
                  email.trim(),

                password,
              }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Login failed."
        )
      }

      if (!data?.token) {
        throw new Error(
          "Login succeeded but no authentication token was returned."
        )
      }

      localStorage.setItem(
        "klyro_token",
        data.token
      )

      if (data.user) {
        localStorage.setItem(
          "klyro_user",
          JSON.stringify(
            data.user
          )
        )
      }

      window.dispatchEvent(
        new Event(
          "klyro-auth-change"
        )
      )

      /*
      ======================================================
      PENDING PROBLEM
      ======================================================
      */

      const pendingProblem =
        localStorage.getItem(
          "klyro_pending_problem"
        )

      localStorage.removeItem(
        "klyro_pending_problem"
      )

      closePanel()

      /*
      ======================================================
      OPTIONAL LEGACY ROUTE
      ======================================================
      */

      if (
        pendingProblem &&
        !isControlled
      ) {
        navigate(
          "/problem-details",
          {
            state: {
              problem:
                pendingProblem,
            },
          }
        )

        return
      }

      if (!isControlled) {
        navigate("/")
      }
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      )

      setError(
        error?.message ||
          "Unable to login."
      )
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        bg-black/70
        p-4
        backdrop-blur-md
        sm:p-6
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          closePanel()
        }
      }}
    >
      <div
        className="
          relative
          w-full
          max-w-[460px]
          overflow-hidden
          rounded-[30px]
          border
          border-white/10
          bg-[#0b0b13]
          shadow-[0_30px_100px_rgba(0,0,0,0.65)]
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* TOP GLOW */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-0
            h-32
            w-72
            -translate-x-1/2
            rounded-full
            bg-purple-600/20
            blur-[70px]
          "
        />

        {/* CLOSE */}

        <button
          type="button"
          onClick={closePanel}
          className="
            absolute
            right-4
            top-4
            z-20
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            border
            border-white/10
            bg-white/5
            text-slate-400
            transition
            hover:bg-white/10
            hover:text-white
          "
          aria-label="Close login"
        >
          ×
        </button>

        <div className="relative p-6 sm:p-8">
          {/* BRAND */}

          <div className="mb-7">
            <div
              className="
                mb-4
                flex
                items-center
                gap-2
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-purple-500
                  to-cyan-500
                  text-lg
                  shadow-lg
                  shadow-purple-950/30
                "
              >
                ✦
              </div>

              <div>
                <div
                  className="
                    text-lg
                    font-bold
                    tracking-tight
                  "
                >
                  KLYRO
                </div>

                <div
                  className="
                    text-[10px]
                    uppercase
                    tracking-[0.2em]
                    text-slate-600
                  "
                >
                  Your next move
                </div>
              </div>
            </div>

            <h1
              className="
                text-2xl
                font-bold
                tracking-tight
                text-white
              "
            >
              Welcome back
            </h1>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-500
              "
            >
              Sign in to continue solving
              problems with KLYRO.
            </p>
          </div>

          {/* ERROR */}

          {error && (
            <div
              className="
                mb-4
                rounded-xl
                border
                border-red-400/15
                bg-red-400/5
                px-4
                py-3
                text-xs
                leading-5
                text-red-200
              "
            >
              {error}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* EMAIL */}

            <div>
              <label
                className="
                  mb-2
                  block
                  text-xs
                  font-medium
                  text-slate-400
                "
              >
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                className="
                  h-12
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.035]
                  px-4
                  text-sm
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-700
                  focus:border-purple-400/30
                  focus:bg-white/[0.05]
                  focus:ring-2
                  focus:ring-purple-500/10
                "
              />
            </div>

            {/* PASSWORD */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  className="
                    text-xs
                    font-medium
                    text-slate-400
                  "
                >
                  Password
                </label>

                <button
                  type="button"
                  className="
                    text-[11px]
                    text-purple-300/70
                    hover:text-purple-200
                  "
                >
                  Forgot password?
                </button>
              </div>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                className="
                  h-12
                  w-full
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.035]
                  px-4
                  text-sm
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-700
                  focus:border-purple-400/30
                  focus:bg-white/[0.05]
                  focus:ring-2
                  focus:ring-purple-500/10
                "
              />
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="
                mt-2
                flex
                h-12
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-purple-500
                via-fuchsia-500
                to-cyan-500
                text-sm
                font-semibold
                text-white
                shadow-lg
                shadow-purple-950/30
                transition
                hover:scale-[1.01]
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading
                ? "Signing in..."
                : "Sign in"}

              {!loading && (
                <span>↗</span>
              )}
            </button>
          </form>

          {/* SWITCH */}

          <div
            className="
              mt-6
              text-center
              text-xs
              text-slate-600
            "
          >
            Don't have an account?

            <button
              type="button"
              onClick={
                switchToSignup
              }
              className="
                ml-1.5
                font-medium
                text-purple-300
                hover:text-purple-200
              "
            >
              Create account
            </button>
          </div>

          {/* LEGACY LINK */}

          {!isControlled && (
            <div className="mt-4 text-center">
              <Link
                to="/"
                className="
                  text-[11px]
                  text-slate-700
                  hover:text-slate-500
                "
              >
                Back to KLYRO
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}