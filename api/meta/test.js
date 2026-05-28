module.exports = async function handler(req, res) {
  return res.status(200).json({
    success: true,
    provider: "Meta Ads",
    message: "Meta connector ready 🚀"
  });
};
