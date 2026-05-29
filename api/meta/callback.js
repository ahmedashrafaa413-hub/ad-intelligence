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
    const shortTokenUrl =
      "https://graph.facebook.com/v19.0/oauth/access_token" +
      `?client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${encodeURIComponent(code)}`;

    const shortRes = await fetch(shortTokenUrl);
    const shortData = await shortRes.json();

    if (shortData.error || !shortData.access_token) {
      return res.status(400).json({
        success: false,
        step: "short_token",
        error: shortData.error || shortData
      });
    }

    const longTokenUrl =
      "https://graph.facebook.com/v19.0/oauth/access_token" +
      "?grant_type=fb_exchange_token" +
      `&client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&fb_exchange_token=${encodeURIComponent(shortData.access_token)}`;

    const longRes = await fetch(longTokenUrl);
    const longData = await longRes.json();

    const token = longData.access_token || shortData.access_token;

    res.setHeader("Set-Cookie", [
      `meta_token=${token}; Path=/; Max-Age=5184000; SameSite=Lax; Secure`
    ]);

    return res.redirect("/?auth=success&platform=meta");
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
