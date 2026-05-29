const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Ad Intelligence Backend"
  });
});

app.get("/meta/accounts", async (req, res) => {
  try {
    const { token } = req.query;

    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?access_token=${token}`
    );

    const data = await response.json();

    res.json(data);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.get("/meta/campaigns", async (req, res) => {
  try {
    const { accountId, token } = req.query;

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=id,name,status&access_token=${token}`
    );

    const data = await response.json();

    res.json(data);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.get("/meta/insights", async (req, res) => {
  try {
    const { accountId, token } = req.query;

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${accountId}/insights?fields=spend,impressions,clicks,reach,cpm,ctr&access_token=${token}`
    );

    const data = await response.json();

    res.json(data);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
