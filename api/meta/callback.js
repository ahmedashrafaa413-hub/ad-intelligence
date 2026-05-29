module.exports = async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.redirect(
      `/?auth=error&platform=meta&msg=${encodeURIComponent(
        error_description || error
      )}`
    );
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      error: "No code received from Meta"
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
    "https://ad-intelligence-an2i.vercel.app/api/meta/callback";

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
        error: tokenData.error || tokenData
      });
    }

    const longTokenUrl =
      "https://graph.facebook.com/v19.0/oauth/access_token" +
      "?grant_type=fb_exchange_token" +
      `&client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&fb_exchange_token=${encodeURIComponent(tokenData.access_token)}`;

    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();

    const accessToken =
      longTokenData.access_token || tokenData.access_token;

    res.setHeader("Set-Cookie", [
      `meta_token=${encodeURIComponent(accessToken)}; Path=/; Max-Age=5184000; SameSite=Lax; Secure`
    ]);

    return res.redirect("/?auth=success&platform=meta");
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
