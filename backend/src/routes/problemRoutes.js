const express = require("express")

const authenticateToken = require("../middleware/authMiddleware")
const {
  createProblem,
  getUserProblems,
} = require("../controllers/problemController")

const router = express.Router()

// POST /api/problems
router.post(
  "/",
  authenticateToken,
  createProblem
)

// GET /api/problems
router.get(
  "/",
  authenticateToken,
  getUserProblems
)

module.exports = router