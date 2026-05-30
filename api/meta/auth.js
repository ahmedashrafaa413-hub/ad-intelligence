module.exports = async (req, res) => {
  const appId = process.env.META_APP_ID;

  if (!appId) {
    return res.status(500).json({
      success: false,
      error: "META_APP_ID is missing"
    });
  }

  const host = req.headers.host;
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/meta/callback`;

  const scope = [
    "ads_read",
    "ads_management",
    "business_management"
  ].join(",");

  const authUrl =
    "https://www.facebook.com/v19.0/dialog/oauth" +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    "&response_type=code";

  return res.redirect(authUrl);
};
