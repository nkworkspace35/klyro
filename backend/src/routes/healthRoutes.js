const express = require("express")

const { healthCheck } = require("../controllers/healthController")
const { testDatabase } = require("../controllers/dbController")

const router = express.Router()

router.get("/health", healthCheck)
router.get("/db-test", testDatabase)

module.exports = router