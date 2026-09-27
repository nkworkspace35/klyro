const pool = require("../config/db")

const createProblem = async (req, res) => {
  try {
    const { title, description } = req.body
    const userId = req.user.userId

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Problem description is required",
      })
    }

    const result = await pool.query(
      `INSERT INTO problems
       (user_id, title, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        userId,
        title?.trim() || "Untitled problem",
        description.trim(),
      ]
    )

    res.status(201).json({
      success: true,
      message: "Problem created successfully",
      problem: result.rows[0],
    })
  } catch (error) {
    console.error(
      "Create problem error:",
      error.message
    )

    res.status(500).json({
      success: false,
      message: "Unable to create problem",
    })
  }
}


const getUserProblems = async (req, res) => {
  try {
    const userId = req.user.userId

    const result = await pool.query(
      `SELECT
         id,
         user_id,
         title,
         description,
         status,
         ai_status,
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
    console.error(
      "Get problems error:",
      error.message
    )

    res.status(500).json({
      success: false,
      message: "Unable to fetch problems",
    })
  }
}


const getProblemById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const problemResult = await pool.query(
      `SELECT
         id,
         user_id,
         title,
         description,
         status,
         ai_response,
         ai_solution,
         ai_status,
         created_at,
         updated_at
       FROM problems
       WHERE id = $1
       AND user_id = $2`,
      [
        id,
        userId,
      ]
    )

    if (problemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      })
    }

    const actionsResult = await pool.query(
      `SELECT
         id,
         problem_id,
         step_number,
         title,
         description,
         completed,
         created_at,
         updated_at
       FROM problem_actions
       WHERE problem_id = $1
       ORDER BY step_number ASC`,
      [id]
    )

    const problem =
      problemResult.rows[0]

    problem.actions =
      actionsResult.rows

    res.json({
      success: true,
      problem,
    })
  } catch (error) {
    console.error(
      "Get problem error:",
      error.message
    )

    res.status(500).json({
      success: false,
      message: "Unable to fetch problem",
    })
  }
}


const updateProblem = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description } = req.body
    const userId = req.user.userId

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Problem description is required",
      })
    }

    const result = await pool.query(
      `UPDATE problems
       SET
         title = $1,
         description = $2,
         ai_response = NULL,
         ai_solution = NULL,
         ai_status = 'pending',
         updated_at = NOW()
       WHERE id = $3
       AND user_id = $4
       RETURNING *`,
      [
        title?.trim() || "Untitled problem",
        description.trim(),
        id,
        userId,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      })
    }

    await pool.query(
      `DELETE FROM problem_actions
       WHERE problem_id = $1`,
      [id]
    )

    res.json({
      success: true,
      message: "Problem updated successfully",
      problem: result.rows[0],
    })
  } catch (error) {
    console.error(
      "Update problem error:",
      error.message
    )

    res.status(500).json({
      success: false,
      message: "Unable to update problem",
    })
  }
}


const updateProblemStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userId = req.user.userId

    const allowedStatuses = [
      "active",
      "in_progress",
      "resolved",
    ]

    if (
      !status ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid problem status",
      })
    }

    const result = await pool.query(
      `UPDATE problems
       SET
         status = $1,
         updated_at = NOW()
       WHERE id = $2
       AND user_id = $3
       RETURNING *`,
      [
        status,
        id,
        userId,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      })
    }

    res.json({
      success: true,
      message: "Problem status updated successfully",
      problem: result.rows[0],
    })
  } catch (error) {
    console.error(
      "Update status error:",
      error.message
    )

    res.status(500).json({
      success: false,
      message: "Unable to update problem status",
    })
  }
}


const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const result = await pool.query(
      `DELETE FROM problems
       WHERE id = $1
       AND user_id = $2
       RETURNING id`,
      [
        id,
        userId,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      })
    }

    res.json({
      success: true,
      message: "Problem deleted successfully",
    })
  } catch (error) {
    console.error(
      "Delete problem error:",
      error.message
    )

    res.status(500).json({
      success: false,
      message: "Unable to delete problem",
    })
  }
}


const saveAIResponse = async (req, res) => {
  try {
    const { id } = req.params
    const { aiResponse } = req.body
    const userId = req.user.userId

    if (!aiResponse) {
      return res.status(400).json({
        success: false,
        message: "AI response is required",
      })
    }

    const result = await pool.query(
      `UPDATE problems
       SET
         ai_response = $1,
         ai_status = 'completed',
         updated_at = NOW()
       WHERE id = $2
       AND user_id = $3
       RETURNING *`,
      [
        aiResponse,
        id,
        userId,
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      })
    }

    res.json({
      success: true,
      message: "AI response saved successfully",
      problem: result.rows[0],
    })
  } catch (error) {
    console.error(
      "Save AI response error:",
      error.message
    )

    res.status(500).json({
      success: false,
      message: "Unable to save AI response",
    })
  }
}


const updateProblemAction = async (
  req,
  res
) => {
  try {
    const { id, actionId } =
      req.params

    const { completed } =
      req.body

    const userId =
      req.user.userId

    if (
      typeof completed !==
      "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Completed must be true or false",
      })
    }

    const ownershipResult =
      await pool.query(
        `SELECT id
         FROM problems
         WHERE id = $1
         AND user_id = $2`,
        [
          id,
          userId,
        ]
      )

    if (
      ownershipResult.rows
        .length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Problem not found",
      })
    }

    const result =
      await pool.query(
        `UPDATE problem_actions
         SET
           completed = $1,
           updated_at = NOW()
         WHERE id = $2
         AND problem_id = $3
         RETURNING
           id,
           problem_id,
           step_number,
           title,
           description,
           completed,
           created_at,
           updated_at`,
        [
          completed,
          actionId,
          id,
        ]
      )

    if (
      result.rows.length ===
      0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Action not found",
      })
    }

    res.json({
      success: true,
      message:
        "Action updated successfully",
      action:
        result.rows[0],
    })
  } catch (error) {
    console.error(
      "Update action error:",
      error.message
    )

    res.status(500).json({
      success: false,
      message:
        "Unable to update action",
    })
  }
}


module.exports = {
  createProblem,
  getUserProblems,
  getProblemById,
  updateProblem,
  updateProblemStatus,
  deleteProblem,
  saveAIResponse,
  updateProblemAction,
}