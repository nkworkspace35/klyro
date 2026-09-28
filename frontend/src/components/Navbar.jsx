import {
  useEffect,
  useState,
} from "react"

import {
  Link,
  useNavigate,
} from "react-router-dom"


function Navbar() {

  const navigate =
    useNavigate()


  /* =========================================================
     NAVIGATION MENU
     ========================================================= */

  const [
    isMenuOpen,
    setIsMenuOpen,
  ] = useState(false)


  /* =========================================================
     AUTH STATE
     ========================================================= */

  const [
    isLoggedIn,
    setIsLoggedIn,
  ] = useState(false)


  const [
    user,
    setUser,
  ] = useState(null)


  /* =========================================================
     SYNC AUTH
     ========================================================= */

  const syncAuth = () => {

    const token =
      localStorage.getItem(
        "klyro_token"
      )

    const storedUser =
      localStorage.getItem(
        "klyro_user"
      )


    setIsLoggedIn(
      Boolean(token)
    )


    if (storedUser) {

      try {

        setUser(
          JSON.parse(
            storedUser
          )
        )

      } catch {

        setUser(null)

      }

    } else {

      setUser(null)

    }

  }


  /* =========================================================
     AUTH LISTENERS
     ========================================================= */

  useEffect(() => {

    syncAuth()


    const handleAuthChange =
      () => {
        syncAuth()
      }


    window.addEventListener(
      "klyro-auth-change",
      handleAuthChange
    )


    window.addEventListener(
      "storage",
      handleAuthChange
    )


    return () => {

      window.removeEventListener(
        "klyro-auth-change",
        handleAuthChange
      )


      window.removeEventListener(
        "storage",
        handleAuthChange
      )

    }

  }, [])


  /* =========================================================
     OPEN LOGIN DRAWER
     ========================================================= */

  const handleLogin = () => {

    setIsMenuOpen(false)


    window.dispatchEvent(
      new Event(
        "klyro-open-login"
      )
    )

  }


  /* =========================================================
     OPEN SIGNUP DRAWER
     ========================================================= */

  const handleSignup = () => {

    setIsMenuOpen(false)


    window.dispatchEvent(
      new Event(
        "klyro-open-signup"
      )
    )

  }


  /* =========================================================
     LOGOUT
     ========================================================= */

  const handleLogout = () => {

    localStorage.removeItem(
      "klyro_token"
    )


    localStorage.removeItem(
      "klyro_user"
    )


    /*
     * Tell the complete application
     * that authentication changed.
     */

    window.dispatchEvent(
      new Event(
        "klyro-auth-change"
      )
    )


    setIsMenuOpen(false)


    navigate("/", {
      replace: true,
    })

  }


  /* =========================================================
     USER INITIAL
     ========================================================= */

  const getInitial = () => {

    if (!user?.name) {
      return "U"
    }


    return user.name
      .charAt(0)
      .toUpperCase()

  }


  /* =========================================================
     CLOSE MOBILE MENU
     ========================================================= */

  const closeMobileMenu = () => {

    setIsMenuOpen(false)

  }


  /* =========================================================
     RENDER
     ========================================================= */

  return (

    <nav
      className="
        fixed
        left-0
        top-0
        z-50
        w-full
        border-b
        border-white/10
        bg-[#08090D]/80
        backdrop-blur-xl
      "
    >

      {/* =====================================================
          NAVBAR CONTAINER
          ===================================================== */}

      <div
        className="
          mx-auto
          flex
          h-16
          max-w-7xl
          items-center
          justify-between
          px-4
          sm:px-6
          lg:px-8
        "
      >

        {/* ===================================================
            LOGO
            =================================================== */}

        <Link
          to="/"
          onClick={
            closeMobileMenu
          }
          className="
            text-xl
            font-bold
            tracking-tight
            text-white
          "
        >
          KLYRO{" "}

          <span
            className="
              text-violet-400
            "
          >
            ✦
          </span>

        </Link>


        {/* ===================================================
            DESKTOP NAVIGATION
            =================================================== */}

        <div
          className="
            hidden
            items-center
            gap-8
            md:flex
          "
        >

          <a
            href="/#home"
            className="
              text-sm
              text-slate-300
              transition
              hover:text-white
            "
          >
            Home
          </a>


          <a
            href="/#how-it-works"
            className="
              text-sm
              text-slate-300
              transition
              hover:text-white
            "
          >
            How it works
          </a>


          <a
            href="/#features"
            className="
              text-sm
              text-slate-300
              transition
              hover:text-white
            "
          >
            Features
          </a>


          <a
            href="/#about"
            className="
              text-sm
              text-slate-300
              transition
              hover:text-white
            "
          >
            About
          </a>


          {isLoggedIn && (

            <a
              href="/#workspace"
              className="
                text-sm
                text-slate-300
                transition
                hover:text-white
              "
            >
              My problems
            </a>

          )}

        </div>


        {/* ===================================================
            DESKTOP AUTH AREA
            =================================================== */}

        <div
          className="
            hidden
            items-center
            gap-3
            md:flex
          "
        >

          {!isLoggedIn ? (

            <>
              {/* =================================================
                  LOGIN
                  ================================================= */}

              <button
                type="button"
                onClick={
                  handleLogin
                }
                className="
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.04]
                  px-5
                  py-2
                  text-sm
                  font-medium
                  text-slate-300
                  transition
                  hover:border-white/20
                  hover:bg-white/[0.08]
                  hover:text-white
                "
              >
                Log in
              </button>


              {/* =================================================
                  SIGNUP
                  ================================================= */}

              <button
                type="button"
                onClick={
                  handleSignup
                }
                className="
                  rounded-full
                  bg-violet-500
                  px-5
                  py-2
                  text-sm
                  font-medium
                  text-white
                  shadow-[0_8px_25px_rgba(139,92,246,0.15)]
                  transition
                  hover:bg-violet-400
                  hover:shadow-[0_10px_30px_rgba(139,92,246,0.25)]
                "
              >
                Get started ✦
              </button>

            </>

          ) : (

            <>
              {/* =================================================
                  USER
                  ================================================= */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-violet-400/20
                    bg-violet-500/10
                    text-sm
                    font-semibold
                    text-violet-300
                  "
                >
                  {getInitial()}
                </div>


                <div
                  className="
                    max-w-32
                  "
                >

                  <p
                    className="
                      truncate
                      text-sm
                      font-medium
                      text-white
                    "
                  >
                    {user?.name ||
                      "User"}
                  </p>


                  <p
                    className="
                      truncate
                      text-xs
                      text-slate-500
                    "
                  >
                    {user?.email ||
                      ""}
                  </p>

                </div>

              </div>


              {/* =================================================
                  LOGOUT
                  ================================================= */}

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.04]
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-slate-300
                  transition
                  hover:border-rose-400/20
                  hover:bg-rose-400/10
                  hover:text-rose-300
                "
              >
                Logout
              </button>

            </>

          )}

        </div>


        {/* ===================================================
            MOBILE MENU BUTTON
            =================================================== */}

        <button
          type="button"
          onClick={() =>
            setIsMenuOpen(
              !isMenuOpen
            )
          }
          className="
            rounded-lg
            p-2
            text-slate-300
            transition
            hover:bg-white/10
            hover:text-white
            md:hidden
          "
          aria-label="Toggle navigation menu"
          aria-expanded={
            isMenuOpen
          }
        >

          <span
            className="
              text-2xl
            "
          >
            {isMenuOpen
              ? "×"
              : "☰"}
          </span>

        </button>

      </div>


      {/* =====================================================
          MOBILE MENU
          ===================================================== */}

      {isMenuOpen && (

        <div
          className="
            border-t
            border-white/10
            bg-[#08090D]/95
            px-4
            py-5
            backdrop-blur-xl
            md:hidden
          "
        >

          <div
            className="
              mx-auto
              flex
              max-w-7xl
              flex-col
              gap-4
            "
          >

            {/* =================================================
                MOBILE HOME
                ================================================= */}

            <a
              href="/#home"
              onClick={
                closeMobileMenu
              }
              className="
                text-sm
                text-slate-300
                transition
                hover:text-white
              "
            >
              Home
            </a>


            {/* =================================================
                MOBILE HOW IT WORKS
                ================================================= */}

            <a
              href="/#how-it-works"
              onClick={
                closeMobileMenu
              }
              className="
                text-sm
                text-slate-300
                transition
                hover:text-white
              "
            >
              How it works
            </a>


            {/* =================================================
                MOBILE FEATURES
                ================================================= */}

            <a
              href="/#features"
              onClick={
                closeMobileMenu
              }
              className="
                text-sm
                text-slate-300
                transition
                hover:text-white
              "
            >
              Features
            </a>


            {/* =================================================
                MOBILE ABOUT
                ================================================= */}

            <a
              href="/#about"
              onClick={
                closeMobileMenu
              }
              className="
                text-sm
                text-slate-300
                transition
                hover:text-white
              "
            >
              About
            </a>


            {/* =================================================
                MOBILE MY PROBLEMS
                ================================================= */}

            {isLoggedIn && (

              <a
                href="/#workspace"
                onClick={
                  closeMobileMenu
                }
                className="
                  text-sm
                  text-slate-300
                  transition
                  hover:text-white
                "
              >
                My problems
              </a>

            )}


            {/* =================================================
                MOBILE AUTH
                ================================================= */}

            {!isLoggedIn ? (

              <>

                {/* -------------------------------------------------
                    MOBILE LOGIN
                    ------------------------------------------------- */}

                <button
                  type="button"
                  onClick={
                    handleLogin
                  }
                  className="
                    mt-2
                    rounded-full
                    border
                    border-white/10
                    bg-white/[0.04]
                    px-5
                    py-2.5
                    text-center
                    text-sm
                    font-medium
                    text-slate-300
                    transition
                    hover:border-white/20
                    hover:bg-white/[0.08]
                    hover:text-white
                  "
                >
                  Log in
                </button>


                {/* -------------------------------------------------
                    MOBILE SIGNUP
                    ------------------------------------------------- */}

                <button
                  type="button"
                  onClick={
                    handleSignup
                  }
                  className="
                    rounded-full
                    bg-violet-500
                    px-5
                    py-2.5
                    text-center
                    text-sm
                    font-medium
                    text-white
                    transition
                    hover:bg-violet-400
                  "
                >
                  Get started ✦
                </button>

              </>

            ) : (

              <>

                {/* -------------------------------------------------
                    MOBILE USER
                    ------------------------------------------------- */}

                <div
                  className="
                    mt-2
                    flex
                    items-center
                    gap-3
                    border-t
                    border-white/10
                    pt-4
                  "
                >

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-violet-400/20
                      bg-violet-500/10
                      text-sm
                      font-semibold
                      text-violet-300
                    "
                  >
                    {getInitial()}
                  </div>


                  <div>

                    <p
                      className="
                        text-sm
                        font-medium
                        text-white
                      "
                    >
                      {user?.name ||
                        "User"}
                    </p>


                    <p
                      className="
                        text-xs
                        text-slate-500
                      "
                    >
                      {user?.email ||
                        ""}
                    </p>

                  </div>

                </div>


                {/* -------------------------------------------------
                    MOBILE LOGOUT
                    ------------------------------------------------- */}

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="
                    rounded-full
                    border
                    border-rose-400/20
                    bg-rose-400/10
                    px-5
                    py-2.5
                    text-center
                    text-sm
                    font-medium
                    text-rose-300
                    transition
                    hover:bg-rose-400/20
                  "
                >
                  Logout
                </button>

              </>

            )}

          </div>

        </div>

      )}

    </nav>

  )
}


export default Navbar