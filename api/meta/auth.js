export default async function handler(req, res) {
  const clientId = process.env.META_APP_ID;

  const redirectUri =
    'https://ad-intelligence-an2i.vercel.app/api/auth/meta';

  const scope = [
    'ads_read',
    'ads_management',
    'business_management'
  ].join(',');

  const url =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scope}` +
    `&response_type=code`;

  res.redirect(url);
}
