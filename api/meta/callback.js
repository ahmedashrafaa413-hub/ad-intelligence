const fetch = require("node-fetch");

module.exports = async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Missing code"
      });
    }

    const redirectUri =
      "https://ad-intelligence-an2i.vercel.app/api/meta/callback";

    const tokenUrl =
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    return res.status(200).json({
      success: true,
      access_token: tokenData.access_token
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
