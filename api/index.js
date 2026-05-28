require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| DATABASE
|--------------------------------------------------------------------------
*/

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/*
|--------------------------------------------------------------------------
| ROOT API
|--------------------------------------------------------------------------
*/

app.get("/api", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    return res.json({
      success: true,
      message: "Backend is running 🚀",
      database: "Connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| META TEST
|--------------------------------------------------------------------------
*/

app.get("/api/meta/test", async (req, res) => {
  return res.json({
    success: true,
    provider: "Meta Ads",
    message: "Meta connector ready 🚀",
  });
});

/*
|--------------------------------------------------------------------------
| META CAMPAIGNS
|--------------------------------------------------------------------------
*/

app.get("/api/meta/campaigns", async (req, res) => {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    const accountId = process.env.META_ACCOUNT_ID;

    if (!accessToken || !accountId) {
      return res.status(500).json({
        success: false,
        error: "META_ACCESS_TOKEN or META_ACCOUNT_ID missing",
      });
    }

    const response = await axios.get(
      `https://graph.facebook.com/v19.0/act_${accountId}/campaigns`,
      {
        params: {
          access_token: accessToken,
          fields:
            "id,name,status,objective,daily_budget,lifetime_budget",
          limit: 100,
        },
      }
    );

    return res.json({
      success: true,
      provider: "Meta Ads",
      campaigns: response.data.data || [],
    });
  } catch (error) {
    console.error(error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| META INSIGHTS
|--------------------------------------------------------------------------
*/

app.get("/api/meta/insights", async (req, res) => {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    const accountId = process.env.META_ACCOUNT_ID;

    if (!accessToken || !accountId) {
      return res.status(500).json({
        success: false,
        error: "META_ACCESS_TOKEN or META_ACCOUNT_ID missing",
      });
    }

    const response = await axios.get(
      `https://graph.facebook.com/v19.0/act_${accountId}/insights`,
      {
        params: {
          access_token: accessToken,
          fields:
            "campaign_name,impressions,clicks,ctr,cpc,spend,reach",
          date_preset: "last_30d",
        },
      }
    );

    return res.json({
      success: true,
      provider: "Meta Ads",
      insights: response.data.data || [],
    });
  } catch (error) {
    console.error(error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| EXPORT APP FOR VERCEL
|--------------------------------------------------------------------------
*/

module.exports = app;
