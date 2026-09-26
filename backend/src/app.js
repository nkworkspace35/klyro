const express = require("express")
const cors = require("cors")

const healthRoutes = require("./routes/healthRoutes")
const authRoutes = require("./routes/authRoutes")
const protectedRoutes = require("./routes/protectedRoutes")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use("/api", healthRoutes)
app.use("/api/auth", authRoutes)
app.use("/api", protectedRoutes)

module.exports = app