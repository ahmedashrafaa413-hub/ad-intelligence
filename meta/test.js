module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    provider: "Meta Ads",
    message: "Meta API route is working"
  });
};
