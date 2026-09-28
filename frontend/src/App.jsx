import {
  useEffect,
  useState,
} from "react"

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import ChatHistory from "./components/ChatHistory"
import WorkspaceSidebar from "./components/WorkspaceSidebar"
import HowItWorks from "./components/HowItWorks"
import Features from "./components/Features"
import FinalCTA from "./components/FinalCTA"
import Footer from "./components/Footer"

import Login from "./pages/Login"
import Signup from "./pages/Signup"
import ProblemDetails from "./pages/ProblemDetails"


function Home() {

  /* =========================================================
     AUTHENTICATION STATE
     ========================================================= */

  const [isLoggedIn, setIsLoggedIn] =
    useState(() => {
      return Boolean(
        localStorage.getItem(
          "klyro_token"
        )
      )
    })


  /* =========================================================
     AUTH PANEL

     null      = no auth panel
     "login"   = login drawer
     "signup"  = signup drawer
     ========================================================= */

  const [authPanel, setAuthPanel] =
    useState(null)


  /* =========================================================
     AUTH EVENT LISTENERS
     ========================================================= */

  useEffect(() => {

    /*
     * Existing authentication change event.
     *
     * Login.jsx already dispatches:
     *
     * klyro-auth-change
     *
     * after successful login.
     */

    function syncAuth() {

      const loggedIn =
        Boolean(
          localStorage.getItem(
            "klyro_token"
          )
        )

      setIsLoggedIn(loggedIn)


      /*
       * If login was successful,
       * close the authentication drawer.
       */

      if (loggedIn) {
        setAuthPanel(null)
      }
    }


    /*
     * Open Login drawer.
     */

    function openLogin() {
      setAuthPanel("login")
    }


    /*
     * Open Signup drawer.
     */

    function openSignup() {
      setAuthPanel("signup")
    }


    /*
     * Close authentication drawer.
     */

    function closeAuth() {
      setAuthPanel(null)
    }


    /* ---------------------------------------------------------
       LISTENERS
       --------------------------------------------------------- */

    window.addEventListener(
      "klyro-auth-change",
      syncAuth
    )

    window.addEventListener(
      "klyro-open-login",
      openLogin
    )

    window.addEventListener(
      "klyro-open-signup",
      openSignup
    )

    window.addEventListener(
      "klyro-close-auth",
      closeAuth
    )


    /* ---------------------------------------------------------
       CLEANUP
       --------------------------------------------------------- */

    return () => {

      window.removeEventListener(
        "klyro-auth-change",
        syncAuth
      )

      window.removeEventListener(
        "klyro-open-login",
        openLogin
      )

      window.removeEventListener(
        "klyro-open-signup",
        openSignup
      )

      window.removeEventListener(
        "klyro-close-auth",
        closeAuth
      )

    }

  }, [])


  /* =========================================================
     CLOSE AUTH PANEL
     ========================================================= */

  const closeAuthPanel = () => {
    setAuthPanel(null)
  }


  /* =========================================================
     SWITCH LOGIN → SIGNUP
     ========================================================= */

  const switchToSignup = () => {
    setAuthPanel("signup")
  }


  /* =========================================================
     SWITCH SIGNUP → LOGIN
     ========================================================= */

  const switchToLogin = () => {
    setAuthPanel("login")
  }


  /* =========================================================
     HOME
     ========================================================= */

  return (

    <div
      className="
        min-h-screen
        bg-[#08090D]
        text-white
      "
    >

      {/* =====================================================
          NAVBAR
          ===================================================== */}

      <Navbar />


      {/* =====================================================
          MAIN PAGE
          ===================================================== */}

      <main>

        {/* ===================================================
            MAIN AI CHAT
            =================================================== */}

        <Hero />


        {/* ===================================================
            HISTORY

            Only logged-in users can access history.
            =================================================== */}

        {isLoggedIn && (
          <ChatHistory />
        )}


        {/* ===================================================
            WORKSPACE

            WorkspaceSidebar remains mounted for logged-in
            users so it can listen for:

            klyro-workspace-open
            =================================================== */}

        {isLoggedIn && (
          <WorkspaceSidebar />
        )}


        {/* ===================================================
            LANDING PAGE SECTIONS
            =================================================== */}

        <HowItWorks />

        <Features />

        <FinalCTA />

      </main>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <Footer />


      {/* =====================================================
          AUTH OVERLAYS

          These are mounted on the HOME page.

          Therefore Login / Signup no longer need to take
          the user away from the KLYRO AI page.
          ===================================================== */}


      {/* =====================================================
          LOGIN DRAWER
          ===================================================== */}

      <Login
        open={
          authPanel === "login"
        }

        onClose={
          closeAuthPanel
        }

        onSwitchToSignup={
          switchToSignup
        }
      />


      {/* =====================================================
          SIGNUP DRAWER
          ===================================================== */}

      <Signup
        open={
          authPanel === "signup"
        }

        onClose={
          closeAuthPanel
        }

        onSwitchToLogin={
          switchToLogin
        }
      />

    </div>

  )
}


/* =============================================================
   APP
   ============================================================= */

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* ===================================================
            HOME
            =================================================== */}

        <Route
          path="/"
          element={
            <Home />
          }
        />


        {/* ===================================================
            LEGACY / DIRECT LOGIN ROUTE

            Keep this route so an old /login URL doesn't
            break the application.

            Normal KLYRO UI will open Login as an overlay.
            =================================================== */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        {/* ===================================================
            LEGACY / DIRECT SIGNUP ROUTE
            =================================================== */}

        <Route
          path="/signup"
          element={
            <Signup />
          }
        />


        {/* ===================================================
            PROBLEM DETAILS
            =================================================== */}

        <Route
          path="/problems/:id"
          element={
            <ProblemDetails />
          }
        />


        {/* ===================================================
            OLD DASHBOARD ROUTE

            Keep compatibility with any old dashboard link.
            =================================================== */}

        <Route
          path="/dashboard"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />


        {/* ===================================================
            UNKNOWN ROUTES
            =================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>

  )
}


export default App