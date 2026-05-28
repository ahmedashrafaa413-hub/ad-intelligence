const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({
    success: true,
    insights: {
      spend: 1200,
      impressions: 45000,
      clicks: 2100,
      ctr: 4.5,
      roas: 3.8,
    },
  });
});

module.exports = router;
