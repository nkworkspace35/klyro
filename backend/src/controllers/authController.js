const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const pool = require("../config/db")

// ==============================
// REGISTER USER
// ==============================
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      })
    }

    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    )

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Insert user into database
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    )

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: result.rows[0],
    })
  } catch (error) {
    console.error("Registration error:", error.message)

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    })
  }
}

// ==============================
// LOGIN USER
// ==============================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      })
    }

    // Find user by email
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    )

    // User not found
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    const user = result.rows[0]

    // Compare entered password with stored hash
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    )

    // Wrong password
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    )

    // Login successful
    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error.message)

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    })
  }
}

// ==============================
// EXPORT FUNCTIONS
// ==============================
module.exports = {
  registerUser,
  loginUser,
}