const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "act_123456",
        name: "Demo Account",
        currency: "USD",
      },
    ],
  });
});

module.exports = router;
