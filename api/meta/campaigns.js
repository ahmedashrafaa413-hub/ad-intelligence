const axios = require("axios");

module.exports = async function handler(req, res) {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    const accountId = process.env.META_ACCOUNT_ID;

    if (!accessToken || !accountId) {
      return res.status(500).json({
        success: false,
        error: "META_ACCESS_TOKEN or META_ACCOUNT_ID is missing in Vercel Environment Variables",
      });
    }

    const url = `https://graph.facebook.com/v19.0/act_${accountId}/campaigns`;

    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        fields: "id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time",
        limit: 100,
      },
    });

    return res.status(200).json({
      success: true,
      provider: "Meta Ads",
      account_id: accountId,
      campaigns: response.data.data || [],
      paging: response.data.paging || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      provider: "Meta Ads",
      error: error.response?.data || error.message,
    });
  }
};
