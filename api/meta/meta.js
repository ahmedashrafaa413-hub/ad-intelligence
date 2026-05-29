export default async function handler(req, res) {
  const { code, error, error_description } = req.query;
  
  if (error) {
    return res.redirect(`/?auth=error&msg=${encodeURIComponent(error_description||error)}`);
  }
  if (!code) return res.status(400).json({ error: 'No code' });

  const clientId     = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  const redirectUri  = 'https://ad-intelligence-an2i.vercel.app/api/auth/meta';

  if (!clientId || !clientSecret) {
    return res.redirect('/?auth=error&msg=META_APP_ID+or+META_APP_SECRET+missing');
  }

  try {
    // Exchange code for short-lived token
    const r1 = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`);
    const d1 = await r1.json();
    if (d1.error) return res.redirect(`/?auth=error&msg=${encodeURIComponent(d1.error.message)}`);

    // Exchange for long-lived token (60 days)
    const r2 = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${d1.access_token}`);
    const d2 = await r2.json();
    const token = d2.access_token || d1.access_token;

    // Get ad accounts
    const r3 = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,currency&access_token=${token}`);
    const d3 = await r3.json();
    const accounts = (d3.data||[]).map(a => ({
      id: a.id.replace('act_',''),
      name: a.name,
      currency: a.currency
    }));

    // Set token in cookie (more reliable than URL params for long tokens)
    res.setHeader('Set-Cookie', [
      `meta_token=${token}; Path=/; Max-Age=5184000; SameSite=Lax`,
      `meta_accounts=${encodeURIComponent(JSON.stringify(accounts))}; Path=/; Max-Age=5184000; SameSite=Lax`
    ]);

    // Redirect with minimal params (no token in URL)
    return res.redirect(`/?auth=success&platform=meta&accs=${accounts.length}&name=${encodeURIComponent(accounts[0]?.name||'Meta')}`);

  } catch(e) {
    return res.redirect(`/?auth=error&msg=${encodeURIComponent(e.message)}`);
  }
}
