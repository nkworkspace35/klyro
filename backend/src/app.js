const express = require("express")
const cors = require("cors")

const healthRoutes = require("./routes/healthRoutes")
const authRoutes = require("./routes/authRoutes")
const protectedRoutes = require("./routes/protectedRoutes")
const problemRoutes = require("./routes/problemRoutes")
const aiRoutes = require("./routes/aiRoutes")
const conversationRoutes = require("./routes/conversationRoutes")

const app = express()

// ==============================
// CORS
// ==============================
app.use(
  cors({
    origin: true,
    credentials: true,
  })
)

// ==============================
// BODY PARSER
// ==============================
app.use(
  express.json({
    limit: "25mb",
  })
)

app.use(
  express.urlencoded({
    extended: true,
    limit: "25mb",
  })
)

// ==============================
// HEALTH ROUTES
// ==============================
app.use(
  "/api",
  healthRoutes
)

// ==============================
// AUTH ROUTES
// ==============================
app.use(
  "/api/auth",
  authRoutes
)

// ==============================
// PROTECTED ROUTES
// ==============================
app.use(
  "/api",
  protectedRoutes
)

// ==============================
// PROBLEM ROUTES
// ==============================
app.use(
  "/api/problems",
  problemRoutes
)

// ==============================
// AI ROUTES
// ==============================
app.use(
  "/api",
  aiRoutes
)

// ==============================
// CONVERSATION ROUTES
// ==============================
app.use(
  "/api/conversations",
  conversationRoutes
)

// ==============================
// ROOT ROUTE
// ==============================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KLYRO API is running",
  })
})

// ==============================
// GLOBAL ERROR HANDLER
// ==============================
app.use(
  (err, req, res, next) => {
    console.error(
      "GLOBAL ERROR:",
      err
    )

    if (
      err &&
      err.code ===
        "LIMIT_FILE_SIZE"
    ) {
      return res
        .status(413)
        .json({
          success: false,
          message:
            "File is too large. Maximum allowed size is 15MB.",
        })
    }

    return res
      .status(500)
      .json({
        success: false,
        message:
          err?.message ||
          "Something went wrong on the server.",
      })
  }
)

module.exports = app