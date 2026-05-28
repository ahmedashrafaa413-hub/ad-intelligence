export default async function handler(req, res) {
  const { code, error, error_description } = req.query;

  // لو فيه Error من Meta
  if (error) {
    return res.redirect(
      `/?auth=error&msg=${encodeURIComponent(
        error_description || error
      )}`
    );
  }

  // لو مفيش code
  if (!code) {
    return res.status(400).json({
      success: false,
      error: "No code received from Meta",
    });
  }

  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;

  const redirectUri =
    "https://ad-intelligence-an2i.vercel.app/api/auth/meta";

  try {
    // Exchange code → access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&client_secret=${clientSecret}&code=${code}`
    );

    const tokenData = await tokenResponse.json();

    // لو Meta رجعت Error
    if (tokenData.error) {
      return res.status(400).json({
        success: false,
        error: tokenData.error,
      });
    }

    const accessToken = tokenData.access_token;

    // حفظ التوكن في Cookie
    res.setHeader(
      "Set-Cookie",
      `meta_token=${accessToken}; Path=/; Max-Age=5184000; SameSite=Lax`
    );

    // Redirect للداشبورد
    return res.redirect("/?auth=success&platform=meta");

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
