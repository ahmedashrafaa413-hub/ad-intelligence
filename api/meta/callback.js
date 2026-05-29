module.exports = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: "No code received"
    });
  }

  return res.status(200).json({
    success: true,
    code
  });
};
