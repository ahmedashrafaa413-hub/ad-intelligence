module.exports = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ success: false, error: "No code received" });
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = "https://ad-intelligence-platform-phi.vercel.app/api/meta/callback";

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
      return res.status(400).json({ success: false, error: tokenData });
    }

    const longUrl =
      "https://graph.facebook.com/v19.0/oauth/access_token" +
      `?grant_type=fb_exchange_token` +
      `&client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&fb_exchange_token=${encodeURIComponent(tokenData.access_token)}`;

    const longRes = await fetch(longUrl);
    const longData = await longRes.json();

    const finalToken = longData.access_token || tokenData.access_token;

    res.setHeader("Set-Cookie", [
      `meta_token=${encodeURIComponent(finalToken)}; Path=/; Max-Age=5184000; SameSite=Lax; Secure`
    ]);

    return res.redirect("/?meta=connected");
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
