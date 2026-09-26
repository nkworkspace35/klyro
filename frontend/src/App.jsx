import { BrowserRouter, Routes, Route } from "react-router-dom"

import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import HowItWorks from "./components/HowItWorks"
import Features from "./components/Features"
import FinalCTA from "./components/FinalCTA"
import Footer from "./components/Footer"

import ProtectedRoute from "./components/ProtectedRoute"

import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"


function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <FinalCTA />
      </main>

      <Footer />
    </>
  )
}


function App() {
  return (
    <BrowserRouter>

      <div className="min-h-screen bg-[#08090D] text-white">

        <Routes>

          {/* =========================
              KLYRO LANDING PAGE
          ========================== */}
          <Route
            path="/"
            element={<Home />}
          />


          {/* =========================
              AUTHENTICATION
          ========================== */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/signup"
            element={<Signup />}
          />


          {/* =========================
              PROTECTED DASHBOARD
          ========================== */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

        </Routes>

      </div>

    </BrowserRouter>
  )
}

export default App