export default async function handler(req, res) {
  const { auth_code, error } = req.query;
  if (error||!auth_code) return res.redirect(`/?auth=error&platform=tiktok&msg=${encodeURIComponent(error||'No code')}`);
  const appId = process.env.TIKTOK_APP_ID;
  const secret = process.env.TIKTOK_SECRET;
  try {
    const r = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ app_id: appId, secret, auth_code })
    });
    const d = await r.json();
    if (d.code !== 0) throw new Error(d.message);
    return res.redirect(`/?auth=success&platform=tiktok&token=${d.data?.access_token}`);
  } catch(e) { return res.redirect(`/?auth=error&platform=tiktok&msg=${encodeURIComponent(e.message)}`); }
}
