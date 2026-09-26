const pool = require("../config/db")

// ==============================
// CREATE NEW PROBLEM
// ==============================
const createProblem = async (req, res) => {
  try {
    const { title, description } = req.body

    // Required field check
    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Problem description is required",
      })
    }

    // User ID JWT se milegi
    const userId = req.user.userId

    // Problem database me save karna
    const result = await pool.query(
      `INSERT INTO problems (user_id, title, description)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, title, description, status, created_at, updated_at`,
      [
        userId,
        title || null,
        description.trim(),
      ]
    )

    res.status(201).json({
      success: true,
      message: "Problem saved successfully",
      problem: result.rows[0],
    })

  } catch (error) {
    console.error("Create problem error:", error.message)

    res.status(500).json({
      success: false,
      message: "Unable to save problem",
    })
  }
}


// ==============================
// GET LOGGED-IN USER'S PROBLEMS
// ==============================
const getUserProblems = async (req, res) => {
  try {
    // JWT se logged-in user ki ID
    const userId = req.user.userId

    // Sirf isi user ke problems fetch karna
    const result = await pool.query(
      `SELECT
          id,
          user_id,
          title,
          description,
          status,
          created_at,
          updated_at
       FROM problems
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    res.json({
      success: true,
      problems: result.rows,
    })

  } catch (error) {
    console.error("Get user problems error:", error.message)

    res.status(500).json({
      success: false,
      message: "Unable to load problems",
    })
  }
}


// ==============================
// EXPORT CONTROLLERS
// ==============================
module.exports = {
  createProblem,
  getUserProblems,
}