const express = require("express")

const authenticateToken = require("../middleware/authMiddleware")

const {
  createNewConversation,
  getConversations,
  getSingleConversation,
  renameExistingConversation,
  removeConversation,
} = require("../controllers/conversationController")

const router = express.Router()


// ======================================================
// CREATE NEW CONVERSATION
// POST /api/conversations
// ======================================================

router.post(
  "/",
  authenticateToken,
  createNewConversation
)


// ======================================================
// GET ALL USER CONVERSATIONS
// GET /api/conversations
// ======================================================

router.get(
  "/",
  authenticateToken,
  getConversations
)


// ======================================================
// GET SINGLE CONVERSATION
// GET /api/conversations/:id
// ======================================================

router.get(
  "/:id",
  authenticateToken,
  getSingleConversation
)


// ======================================================
// RENAME CONVERSATION
// PATCH /api/conversations/:id
// ======================================================

router.patch(
  "/:id",
  authenticateToken,
  renameExistingConversation
)


// ======================================================
// DELETE CONVERSATION
// DELETE /api/conversations/:id
// ======================================================

router.delete(
  "/:id",
  authenticateToken,
  removeConversation
)


module.exports = router