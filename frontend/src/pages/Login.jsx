import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

function Login() {
  const navigate = useNavigate()

  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    })

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [message, setMessage] =
    useState("")

  useEffect(() => {
    const token =
      localStorage.getItem(
        "klyro_token"
      )

    if (token) {
      navigate("/", {
        replace: true,
      })
    }
  }, [navigate])

  useEffect(() => {
    const pendingProblem =
      localStorage.getItem(
        "klyro_pending_problem"
      )

    if (pendingProblem) {
      setMessage(
        "Your problem is waiting for you after login."
      )
    }
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response =
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              formData
            ),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        setError(
          data.message ||
            "Login failed"
        )
        return
      }

      localStorage.setItem(
        "klyro_token",
        data.token
      )

      localStorage.setItem(
        "klyro_user",
        JSON.stringify(
          data.user
        )
      )

      window.dispatchEvent(
        new Event(
          "klyro-auth-change"
        )
      )

      const pendingProblem =
        localStorage.getItem(
          "klyro_pending_problem"
        )

      localStorage.removeItem(
        "klyro_pending_problem"
      )

      setMessage(
        "Login successful!"
      )

      setTimeout(() => {
        navigate("/", {
          replace: true,
          state: {
            pendingProblem:
              pendingProblem ||
              "",
          },
        })
      }, 500)
    } catch (error) {
      setError(
        "Unable to connect to the server."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08090D] px-4 py-10 text-white">

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">

        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">

          <div className="text-center">

            <Link
              to="/"
              className="text-2xl font-bold tracking-tight text-white"
            >
              KLYRO{" "}
              <span className="text-violet-400">
                ✦
              </span>
            </Link>

            <h1 className="mt-8 text-2xl font-semibold">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Log in to continue with KLYRO.
            </p>

          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-8 space-y-5"
          >

            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:bg-white/[0.06]"
              />

            </div>

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={
                  formData.password
                }
                onChange={
                  handleChange
                }
                required
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:bg-white/[0.06]"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Logging in..."
                : "Log in"}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-slate-400">

            Don't have an account?{" "}

            <Link
              to="/signup"
              className="font-medium text-violet-400 transition hover:text-violet-300"
            >
              Sign up
            </Link>

          </p>

        </div>

      </div>

    </div>
  )
}

export default Login