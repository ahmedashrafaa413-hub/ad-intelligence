module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    service: "AdIntelligence",
    message: "API is working"
  });
};
