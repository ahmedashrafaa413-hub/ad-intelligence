const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "cmp_001",
        name: "Prospecting Campaign",
        status: "ACTIVE",
        objective: "CONVERSIONS",
        spend: 250,
      },
    ],
  });
});

module.exports = router;
