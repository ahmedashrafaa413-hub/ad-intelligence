module.exports = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({
      success: false,
      error: "No code received"
    });
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return res.status(500).json({
      success: false,
      error: "META_APP_ID or META_APP_SECRET is missing"
    });
  }

  const redirectUri =
    "https://ad-intelligence-platform-phi.vercel.app/api/meta/callback";

  try {
    const tokenUrl =
      "https://graph.facebook.com/v19.0/oauth/access_token" +
      `?client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${encodeURIComponent(code)}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      return res.status(400).json({
        success: false,
        step: "exchange_code",
        error: tokenData.error || tokenData
      });
    }

    const accessToken = tokenData.access_token;

    res.setHeader("Set-Cookie", [
      `meta_token=${encodeURIComponent(accessToken)}; Path=/; Max-Age=5184000; SameSite=Lax; Secure`
    ]);

    return res.redirect("/?meta=connected");
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
