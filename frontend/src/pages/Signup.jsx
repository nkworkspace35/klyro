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

export default function Signup({
  open: controlledOpen,
  onClose,
  onSwitchToLogin,
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
    name,
    setName,
  ] = useState("")

  const [
    email,
    setEmail,
  ] = useState("")

  const [
    password,
    setPassword,
  ] = useState("")

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("")

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  const [
    success,
    setSuccess,
  ] = useState("")

  /*
  ========================================================
  EVENTS
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
      "klyro-open-signup",
      handleOpen
    )

    window.addEventListener(
      "klyro-close-auth",
      handleClose
    )

    return () => {
      window.removeEventListener(
        "klyro-open-signup",
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
  SWITCH LOGIN
  ========================================================
  */

  function switchToLogin() {
    if (onSwitchToLogin) {
      onSwitchToLogin()
      return
    }

    window.dispatchEvent(
      new Event(
        "klyro-open-login"
      )
    )
  }

  /*
  ========================================================
  REGISTER
  ========================================================
  */

  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      setError(
        "Please fill all required fields."
      )

      return
    }

    if (
      password.length < 6
    ) {
      setError(
        "Password must be at least 6 characters."
      )

      return
    }

    if (
      confirmPassword &&
      password !==
        confirmPassword
    ) {
      setError(
        "Passwords do not match."
      )

      return
    }

    setLoading(true)

    try {
      const response =
        await fetch(
          `${API_URL}/api/auth/register`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  name.trim(),

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
            "Signup failed."
        )
      }

      setSuccess(
        "Account created successfully! You can now log in."
      )

      setPassword("")
      setConfirmPassword("")

      /*
      Give user a short confirmation
      before switching to login.
      */

      setTimeout(() => {
        if (onSwitchToLogin) {
          onSwitchToLogin()
        } else {
          window.dispatchEvent(
            new Event(
              "klyro-open-login"
            )
          )
        }
      }, 900)
    } catch (error) {
      console.error(
        "SIGNUP ERROR:",
        error
      )

      setError(
        error?.message ||
          "Unable to create account."
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
            bg-cyan-600/15
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
          aria-label="Close signup"
        >
          ×
        </button>

        <div className="relative p-6 sm:p-8">
          {/* BRAND */}

          <div className="mb-6">
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
                <div className="text-lg font-bold tracking-tight">
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
              Create your account
            </h1>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-500
              "
            >
              Start solving problems with your
              personal KLYRO workspace.
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

          {/* SUCCESS */}

          {success && (
            <div
              className="
                mb-4
                rounded-xl
                border
                border-emerald-400/15
                bg-emerald-400/5
                px-4
                py-3
                text-xs
                leading-5
                text-emerald-200
              "
            >
              {success}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* NAME */}

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
                Full name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Your name"
                autoComplete="name"
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
              <label
                className="
                  mb-2
                  block
                  text-xs
                  font-medium
                  text-slate-400
                "
              >
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
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

            {/* CONFIRM */}

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
                Confirm password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Repeat your password"
                autoComplete="new-password"
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
              disabled={
                loading ||
                Boolean(success)
              }
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
                ? "Creating account..."
                : "Create account"}

              {!loading && (
                <span>↗</span>
              )}
            </button>
          </form>

          {/* SWITCH LOGIN */}

          <div
            className="
              mt-6
              text-center
              text-xs
              text-slate-600
            "
          >
            Already have an account?

            <button
              type="button"
              onClick={
                switchToLogin
              }
              className="
                ml-1.5
                font-medium
                text-purple-300
                hover:text-purple-200
              "
            >
              Sign in
            </button>
          </div>

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