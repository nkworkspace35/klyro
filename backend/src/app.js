const express = require("express")
const cors = require("cors")

const healthRoutes = require("./routes/healthRoutes")
const authRoutes = require("./routes/authRoutes")
const protectedRoutes = require("./routes/protectedRoutes")
const problemRoutes = require("./routes/problemRoutes")

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api", healthRoutes)
app.use("/api/auth", authRoutes)
app.use("/api", protectedRoutes)
app.use("/api/problems", problemRoutes)

module.exports = app