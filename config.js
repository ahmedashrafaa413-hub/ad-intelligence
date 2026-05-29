export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  // Only expose public app IDs, never secrets
  res.json({
    meta_app_id:    process.env.META_APP_ID    || '',
    snap_client_id: process.env.SNAP_CLIENT_ID || '',
    tiktok_app_id:  process.env.TIKTOK_APP_ID  || '',
    ga_configured:  !!process.env.GA_SERVICE_ACCOUNT,
    openrouter:     !!process.env.OPENROUTER_KEY
  });
}
