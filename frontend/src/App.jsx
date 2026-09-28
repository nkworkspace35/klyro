import { useEffect, useState } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import HowItWorks from "./components/HowItWorks"
import Features from "./components/Features"
import FinalCTA from "./components/FinalCTA"
import Footer from "./components/Footer"
import DashboardSection from "./components/DashboardSection"

import Login from "./pages/Login"
import Signup from "./pages/Signup"
import ProblemDetails from "./pages/ProblemDetails"

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("klyro_token"))
  )

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(
        Boolean(localStorage.getItem("klyro_token"))
      )
    }

    window.addEventListener(
      "klyro-auth-change",
      syncAuth
    )

    return () => {
      window.removeEventListener(
        "klyro-auth-change",
        syncAuth
      )
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#08090D] text-white">
      <Navbar />

      <main>
        <Hero />

        {isLoggedIn && <DashboardSection />}

        <HowItWorks />
        <Features />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/problems/:id"
          element={<ProblemDetails />}
        />

        <Route
          path="/dashboard"
          element={<Navigate to="/" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App