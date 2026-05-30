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

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://ad-intelligence-platform.vercel.app";

  const redirectUri = `${appUrl}/api/meta/callback`;

  try {
    const tokenUrl =
      "https://graph.facebook.com/v19.0/oauth/access_token" +
      `?client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${encodeURIComponent(code)}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(400).json({
        success: false,
        error: tokenData
      });
    }

    res.setHeader("Set-Cookie", [
      `meta_token=${encodeURIComponent(tokenData.access_token)}; Path=/; Max-Age=5184000; SameSite=Lax; Secure`
    ]);

    return res.redirect("/connections?meta=connected");
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
