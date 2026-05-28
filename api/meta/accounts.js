const axios = require("axios");

module.exports = async (req, res) => {
  try {
    const accessToken = process.env.META_ACCESS_TOKEN;

    const response = await axios.get(
      "https://graph.facebook.com/v19.0/me/adaccounts",
      {
        params: {
          access_token: accessToken,
          fields: "id,name,account_status,currency"
        }
      }
    );

    res.status(200).json({
      success: true,
      provider: "Meta Ads",
      accounts: response.data.data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};
