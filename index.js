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
| META AUTH
|--------------------------------------------------------------------------
*/

app.get("/api/meta/auth", async (req, res) => {
  try {
    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_REDIRECT_URI;

    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth` +
      `?client_id=${appId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=ads_read,ads_management,business_management`;

    return res.redirect(authUrl);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| META CALLBACK
|--------------------------------------------------------------------------
*/

app.get("/api/meta/callback", async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Authorization code missing",
      });
    }

    const response = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          redirect_uri: process.env.META_REDIRECT_URI,
          code,
        },
      }
    );

    const accessToken = response.data.access_token;

    return res.json({
      success: true,
      message: "Meta OAuth connected successfully 🚀",
      access_token: accessToken,
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
app.get("/api/meta/full-insights", async (req, res) => {
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
          level: "campaign",
          date_preset: "last_30d",
          fields: [
            "campaign_id",
            "campaign_name",
            "impressions",
            "reach",
            "clicks",
            "spend",
            "ctr",
            "cpc",
            "cpm",
            "actions",
            "action_values"
          ].join(","),
          limit: 100
        },
      }
    );

    const rows = (response.data.data || []).map((row) => {
      const actions = row.actions || [];
      const actionValues = row.action_values || [];

      const purchases =
        actions.find((a) => a.action_type === "purchase")?.value ||
        actions.find((a) => a.action_type === "omni_purchase")?.value ||
        0;

      const revenue =
        actionValues.find((a) => a.action_type === "purchase")?.value ||
        actionValues.find((a) => a.action_type === "omni_purchase")?.value ||
        0;

      const spend = Number(row.spend || 0);
      const revenueNumber = Number(revenue || 0);
      const purchasesNumber = Number(purchases || 0);

      return {
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        impressions: Number(row.impressions || 0),
        reach: Number(row.reach || 0),
        clicks: Number(row.clicks || 0),
        spend,
        ctr: Number(row.ctr || 0),
        cpc: Number(row.cpc || 0),
        cpm: Number(row.cpm || 0),
        purchases: purchasesNumber,
        revenue: revenueNumber,
        roas: spend > 0 ? Number((revenueNumber / spend).toFixed(2)) : 0,
        cpa: purchasesNumber > 0 ? Number((spend / purchasesNumber).toFixed(2)) : 0
      };
    });

    return res.json({
      success: true,
      provider: "Meta Ads",
      level: "campaign",
      date_preset: "last_30d",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});
module.exports = app;
