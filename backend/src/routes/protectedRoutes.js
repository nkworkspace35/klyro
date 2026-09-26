const express = require("express")

const authenticateToken = require("../middleware/authMiddleware")
const { getProtectedData } = require("../controllers/protectedController")

const router = express.Router()

router.get(
  "/protected",
  authenticateToken,
  getProtectedData
)

module.exports = router