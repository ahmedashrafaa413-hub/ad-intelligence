const axios = require("axios");

module.exports = async (req, res) => {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;
    const accountId = process.env.META_ACCOUNT_ID;

    if (!accessToken || !accountId) {
      return res.status(500).json({
        success: false,
        error: "META_ACCESS_TOKEN or META_ACCOUNT_ID missing",
      });
    }

    const url = `https://graph.facebook.com/v19.0/act_${accountId}/campaigns`;

    const response = await axios.get(url, {
      params: {
        access_token: accessToken,
        fields: "id,name,status,objective,daily_budget",
      },
    });

    res.json({
      success: true,
      provider: "Meta Ads",
      campaigns: response.data.data,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};
