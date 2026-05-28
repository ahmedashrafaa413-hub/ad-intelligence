const express = require("express");

const router = express.Router();

router.get("/test", async (req, res) => {
  res.json({
    success: true,
    provider: "Meta Ads",
    message: "Meta connector ready 🚀",
  });
});

module.exports = router;
