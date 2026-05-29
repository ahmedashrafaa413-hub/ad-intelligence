module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    provider: "Meta Ads",
    message: "Meta route is working"
  });
};
