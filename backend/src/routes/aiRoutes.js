const express = require("express")

const {
  testAI,
  solveProblem,
} = require("../controllers/aiController")

const authenticateToken = require("../middleware/authMiddleware")

const router = express.Router()

router.get("/test-ai", testAI)

router.post(
  "/solve-problem",
  authenticateToken,
  solveProblem
)

module.exports = router