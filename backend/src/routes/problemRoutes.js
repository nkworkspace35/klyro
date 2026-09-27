const express = require("express")

const {
  createProblem,
  getUserProblems,
  getProblemById,
  updateProblem,
  updateProblemStatus,
  deleteProblem,
  saveAIResponse,
  updateProblemAction,
} = require("../controllers/problemController")

const authenticateToken =
  require("../middleware/authMiddleware")

const router =
  express.Router()


router.post(
  "/",
  authenticateToken,
  createProblem
)


router.get(
  "/",
  authenticateToken,
  getUserProblems
)


router.get(
  "/:id",
  authenticateToken,
  getProblemById
)


router.patch(
  "/:id",
  authenticateToken,
  updateProblem
)


router.patch(
  "/:id/status",
  authenticateToken,
  updateProblemStatus
)


router.delete(
  "/:id",
  authenticateToken,
  deleteProblem
)


router.patch(
  "/:id/ai",
  authenticateToken,
  saveAIResponse
)


router.patch(
  "/:id/actions/:actionId",
  authenticateToken,
  updateProblemAction
)


module.exports = router