const {
  createConversation,
  getUserConversations,
  getConversationById,
  getConversationMessages,
  renameConversation,
  deleteConversation,
} = require("../services/conversationService")


// ======================================================
// GET AUTHENTICATED USER ID
// ======================================================

const getAuthenticatedUserId = (req) => {
  if (!req.user) {
    return null
  }

  // Existing JWT uses userId.
  // Other common names are also supported for safety.
  return (
    req.user.userId ||
    req.user.id ||
    req.user.user_id ||
    null
  )
}


// ======================================================
// CREATE NEW CONVERSATION
// POST /api/conversations
// ======================================================

const createNewConversation = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      })
    }

    const { title } = req.body || {}

    const cleanTitle =
      typeof title === "string" && title.trim()
        ? title.trim()
        : "New Chat"

    const conversation = await createConversation(
      userId,
      cleanTitle
    )

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      conversation,
    })

  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    )

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    })
  }
}


// ======================================================
// GET USER CONVERSATIONS
// GET /api/conversations
// ======================================================

const getConversations = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      })
    }

    const conversations =
      await getUserConversations(userId)

    return res.status(200).json({
      success: true,
      conversations,
    })

  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    )

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    })
  }
}


// ======================================================
// GET SINGLE CONVERSATION
// GET /api/conversations/:id
// ======================================================

const getSingleConversation = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      })
    }

    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      })
    }

    // First verify that this conversation belongs
    // to the authenticated user.
    const conversation =
      await getConversationById(
        id,
        userId
      )

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      })
    }

    // Then fetch its messages.
    const messages =
      await getConversationMessages(
        id,
        userId
      )

    return res.status(200).json({
      success: true,
      conversation,
      messages,
    })

  } catch (error) {
    console.error(
      "Get single conversation error:",
      error
    )

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversation",
    })
  }
}


// ======================================================
// RENAME CONVERSATION
// PATCH /api/conversations/:id
// ======================================================

const renameExistingConversation = async (
  req,
  res
) => {
  try {
    const userId = getAuthenticatedUserId(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      })
    }

    const { id } = req.params
    const { title } = req.body || {}

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      })
    }

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Conversation title is required",
      })
    }

    const cleanTitle = title.trim()

    if (cleanTitle.length > 255) {
      return res.status(400).json({
        success: false,
        message:
          "Conversation title cannot exceed 255 characters",
      })
    }

    const conversation =
      await renameConversation(
        id,
        userId,
        cleanTitle
      )

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      })
    }

    return res.status(200).json({
      success: true,
      message: "Conversation renamed successfully",
      conversation,
    })

  } catch (error) {
    console.error(
      "Rename conversation error:",
      error
    )

    return res.status(500).json({
      success: false,
      message: "Failed to rename conversation",
    })
  }
}


// ======================================================
// DELETE CONVERSATION
// DELETE /api/conversations/:id
// ======================================================

const removeConversation = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      })
    }

    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      })
    }

    const deletedConversation =
      await deleteConversation(
        id,
        userId
      )

    if (!deletedConversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      })
    }

    return res.status(200).json({
      success: true,
      message:
        "Conversation deleted successfully",
    })

  } catch (error) {
    console.error(
      "Delete conversation error:",
      error
    )

    return res.status(500).json({
      success: false,
      message: "Failed to delete conversation",
    })
  }
}


// ======================================================
// EXPORT
// ======================================================

module.exports = {
  createNewConversation,
  getConversations,
  getSingleConversation,
  renameExistingConversation,
  removeConversation,
}