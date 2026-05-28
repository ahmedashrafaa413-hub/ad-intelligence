const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/api", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "Backend is running 🚀",
      database: "Connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/meta/test", async (req, res) => {
  res.json({
    success: true,
    provider: "Meta Ads",
    message: "Meta connector ready 🚀",
  });
});

app.get("/api/meta/campaigns", async (req, res) => {
  res.json({
    success: true,
    provider: "Meta Ads",
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

app.get("/api/meta/accounts", async (req, res) => {
  res.json({
    success: true,
    provider: "Meta Ads",
    data: [
      {
        id: "act_123456",
        name: "Demo Account",
        currency: "USD",
      },
    ],
  });
});

app.get("/api/meta/insights", async (req, res) => {
  res.json({
    success: true,
    provider: "Meta Ads",
    insights: {
      spend: 1200,
      impressions: 45000,
      clicks: 2100,
      ctr: 4.5,
      roas: 3.8,
    },
  });
});

module.exports = app;
