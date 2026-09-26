const jwt = require("jsonwebtoken")

const authenticateToken = (req, res, next) => {
  try {
    // Authorization header se token lena
    const authHeader = req.headers.authorization

    // Token nahi mila
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      })
    }

    // "Bearer TOKEN" ko split karna
    const token = authHeader.split(" ")[1]

    // Token missing hai
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      })
    }

    // JWT verify karna
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    // User information request ke saath attach karna
    req.user = decoded

    // Next middleware/controller par jaana
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
}

module.exports = authenticateToken