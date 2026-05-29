module.exports = async (req, res) => {
  const APP_ID = process.env.META_APP_ID;

  const redirectUri =
    "https://ad-intelligence-an2i.vercel.app/api/meta/callback";

  const authUrl =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=ads_read,ads_management,business_management`;

  return res.redirect(authUrl);
};
