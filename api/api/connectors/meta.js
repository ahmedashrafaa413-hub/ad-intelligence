const express = require("express");
const router = express.Router();

router.get("/meta/test", async (req, res) => {
  try {
    res.json({
      success: true,
      provider: "Meta Ads",
      message: "Meta connector ready 🚀",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
