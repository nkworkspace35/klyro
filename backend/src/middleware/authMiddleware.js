const jwt = require("jsonwebtoken")

const authenticateToken = (req, res, next) => {
  try {
    // ==========================================
    // 1. Authorization header se token lena
    // ==========================================
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      })
    }

    // ==========================================
    // 2. Authorization format check karna
    // Expected:
    // Authorization: Bearer YOUR_TOKEN
    // ==========================================
    const parts = authHeader.trim().split(/\s+/)

    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      })
    }

    const token = parts[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      })
    }

    // ==========================================
    // 3. JWT_SECRET check
    // ==========================================
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured in .env")

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error",
      })
    }

    // ==========================================
    // 4. JWT verify karna
    // ==========================================
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    // ==========================================
    // 5. Decoded user information validate karna
    // ==========================================
    if (!decoded || typeof decoded !== "object") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      })
    }

    // ==========================================
    // 6. User information request ke saath attach
    // ==========================================
    req.user = decoded

    // ==========================================
    // 7. Next middleware/controller
    // ==========================================
    next()

  } catch (error) {
    // ==========================================
    // JWT errors
    // ==========================================
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired",
      })
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      })
    }

    // ==========================================
    // Other authentication errors
    // ==========================================
    console.error("Authentication error:", error.message)

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    })
  }
}

module.exports = authenticateToken