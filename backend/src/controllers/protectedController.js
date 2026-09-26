const pool = require("../config/db")

const getProtectedData = async (req, res) => {
  try {
    // JWT se user ID lena
    const userId = req.user.userId

    // Database se current user ko find karna
    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    )

    // User database me nahi mila
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const user = result.rows[0]

    // User mil gaya
    res.json({
      success: true,
      message: "Protected route accessed successfully",
      user,
    })
  } catch (error) {
    console.error("Protected route error:", error.message)

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    })
  }
}

module.exports = {
  getProtectedData,
}