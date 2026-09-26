const pool = require("../config/db")

const testDatabase = async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()")

    res.json({
      success: true,
      message: "Neon PostgreSQL connected successfully",
      databaseTime: result.rows[0].now,
    })
  } catch (error) {
    console.error("Database connection error:", error.message)

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    })
  }
}

module.exports = {
  testDatabase,
}