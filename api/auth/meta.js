export default async function handler(req, res) {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.redirect(
      `/?auth=error&msg=${encodeURIComponent(
        error_description || error
      )}`
    );
  }

  if (!code) {
    return res.status(400).json({
      error: 'No code'
    });
  }

  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;

  const redirectUri =
    'https://ad-intelligence-an2i.vercel.app/api/auth/meta';

  try {
    // short-lived token
    const r1 = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${clientSecret}` +
      `&code=${code}`
    );

    const d1 = await r1.json();

    // long-lived token
    const r2 = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${clientId}` +
      `&client_secret=${clientSecret}` +
      `&fb_exchange_token=${d1.access_token}`
    );

    const d2 = await r2.json();

    const token = d2.access_token || d1.access_token;

    // save cookie
    res.setHeader(
      'Set-Cookie',
      `meta_token=${token}; Path=/; Max-Age=5184000; SameSite=Lax`
    );

    return res.redirect('/?auth=success');

  } catch (e) {
    return res.redirect(
      `/?auth=error&msg=${encodeURIComponent(e.message)}`
    );
  }
}
