const express = require("express")
const multer = require("multer")

const {
  testAI,
  solveProblem,
} = require("../controllers/aiController")

const {
  chatWithKlyro,
} = require("../controllers/chatController")

const {
  uploadFile,
} = require("../controllers/fileController")

const authenticateToken =
  require("../middleware/authMiddleware")

const router = express.Router()

const MAX_FILE_SIZE =
  15 * 1024 * 1024

const allowedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
  },

  fileFilter: (req, file, cb) => {
    const extension = String(
      file.originalname || ""
    )
      .split(".")
      .pop()
      .toLowerCase()

    const allowedExtensions = [
      "pdf",
      "docx",
      "txt",
      "md",
      "csv",
      "xlsx",
      "xls",
      "png",
      "jpg",
      "jpeg",
      "webp",
    ]

    if (
      allowedTypes.includes(file.mimetype) ||
      allowedExtensions.includes(extension)
    ) {
      cb(null, true)
    } else {
      cb(
        new Error(
          "Unsupported file type."
        )
      )
    }
  },
})

router.post(
  "/chat",
  authenticateToken,
  chatWithKlyro
)

router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  uploadFile
)

router.post(
  "/solve-problem",
  authenticateToken,
  solveProblem
)

router.get(
  "/test-ai",
  testAI
)

module.exports = router