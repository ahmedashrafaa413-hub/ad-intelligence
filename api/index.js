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

app.get("/api/campaigns", async (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

module.exports = app;
