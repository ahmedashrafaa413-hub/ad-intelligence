export default async function handler(req, res) {
  const { code, error } = req.query;
  if (error||!code) return res.redirect(`/?auth=error&platform=snap&msg=${encodeURIComponent(error||'No code')}`);
  const clientId = process.env.SNAP_CLIENT_ID;
  const clientSecret = process.env.SNAP_CLIENT_SECRET;
  const redirectUri = 'https://ad-intelligence-an2i.vercel.app/api/auth/snap';
  try {
    const r = await fetch('https://accounts.snapchat.com/login/oauth2/access_token', {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:`grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    });
    const d = await r.json();
    if (!d.access_token) throw new Error(JSON.stringify(d));
    return res.redirect(`/?auth=success&platform=snap&token=${d.access_token}`);
  } catch(e) { return res.redirect(`/?auth=error&platform=snap&msg=${encodeURIComponent(e.message)}`); }
}
