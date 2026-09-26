const healthCheck = (req, res) => {
  res.json({
    success: true,
    message: "KLYRO backend is running",
  })
}

module.exports = {
  healthCheck,
}