export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const propertyId = body.propertyId || process.env.GA_PROPERTY_ID;
    const startDate = body.startDate || '30daysAgo';
    const endDate = body.endDate || 'today';

    const serviceAccountJson = process.env.GA_SERVICE_ACCOUNT;
    if (!serviceAccountJson) return res.status(500).json({ error: 'GA_SERVICE_ACCOUNT غير موجود في Vercel' });
    if (!propertyId) return res.status(400).json({ error: 'Property ID مطلوب' });

    let credentials;
    try { credentials = JSON.parse(serviceAccountJson); }
    catch (e) { return res.status(500).json({ error: 'GA_SERVICE_ACCOUNT JSON خطأ: ' + e.message }); }

    const accessToken = await getGoogleToken(credentials);

    const gaRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGroup' }, { name: 'deviceCategory' }],
        metrics: [
          { name: 'sessions' }, { name: 'totalUsers' }, { name: 'newUsers' },
          { name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'screenPageViews' },
          { name: 'conversions' }, { name: 'totalRevenue' }, { name: 'ecommercePurchases' },
          { name: 'addToCarts' }, { name: 'checkouts' }
        ],
        limit: 10000
      })
    });

    const gaText = await gaRes.text();
    if (!gaRes.ok) return res.status(gaRes.status).json({ error: 'GA API: ' + gaText.slice(0, 300) });

    let gaData;
    try { gaData = JSON.parse(gaText); }
    catch(e) { return res.status(500).json({ error: 'JSON parse error: ' + gaText.slice(0, 200) }); }

    return res.status(200).json(processGA(gaData));

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function getGoogleToken(creds) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = { iss: creds.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', exp: now+3600, iat: now };
  const sig_input = `${b64(header)}.${b64(payload)}`;
  const { createSign } = await import('crypto');
  const signer = createSign('RSA-SHA256');
  signer.update(sig_input);
  const sig = signer.sign(creds.private_key).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  const jwt = `${sig_input}.${sig}`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('Token error: ' + JSON.stringify(tokenData));
  return tokenData.access_token;
}

function processGA(data) {
  const rows = data.rows || [];
  const dimH = (data.dimensionHeaders||[]).map(h=>h.name);
  const metH = (data.metricHeaders||[]).map(h=>h.name);
  const parsed = rows.map(row => {
    const obj = {};
    dimH.forEach((h,i) => { obj[h] = row.dimensionValues?.[i]?.value||''; });
    metH.forEach((h,i) => { obj[h] = parseFloat(row.metricValues?.[i]?.value||0); });
    return obj;
  });
  const T = { sessions:0,users:0,newUsers:0,pageViews:0,conversions:0,revenue:0,purchases:0,addToCarts:0,checkouts:0 };
  let brSum=0,brN=0,durSum=0,durN=0;
  parsed.forEach(r => {
    T.sessions+=r.sessions||0; T.users+=r.totalUsers||0; T.newUsers+=r.newUsers||0;
    T.pageViews+=r.screenPageViews||0; T.conversions+=r.conversions||0;
    T.revenue+=r.totalRevenue||0; T.purchases+=r.ecommercePurchases||0;
    T.addToCarts+=r.addToCarts||0; T.checkouts+=r.checkouts||0;
    if(r.bounceRate>0){brSum+=r.bounceRate;brN++;}
    if(r.averageSessionDuration>0){durSum+=r.averageSessionDuration;durN++;}
  });
  T.bounceRate = brN>0 ? +(brSum/brN*100).toFixed(2) : 0;
  T.avgSessionDuration = durN>0 ? +(durSum/durN).toFixed(0) : 0;
  T.cvr = T.sessions>0 ? +(T.purchases/T.sessions*100).toFixed(2) : 0;
  T.newUserPct = T.users>0 ? +(T.newUsers/T.users*100).toFixed(1) : 0;
  const chMap={}, devMap={}, dateMap={};
  parsed.forEach(r => {
    const ch=r.sessionDefaultChannelGroup||'Other';
    if(!chMap[ch]) chMap[ch]={channel:ch,sessions:0,users:0,conversions:0,revenue:0};
    chMap[ch].sessions+=r.sessions||0; chMap[ch].users+=r.totalUsers||0;
    chMap[ch].conversions+=r.conversions||0; chMap[ch].revenue+=r.totalRevenue||0;
    const dev=r.deviceCategory||'other';
    if(!devMap[dev]) devMap[dev]={device:dev,sessions:0,users:0};
    devMap[dev].sessions+=r.sessions||0; devMap[dev].users+=r.totalUsers||0;
    if(!r.date) return;
    if(!dateMap[r.date]) dateMap[r.date]={date:r.date,sessions:0,users:0,conversions:0};
    dateMap[r.date].sessions+=r.sessions||0; dateMap[r.date].users+=r.totalUsers||0;
    dateMap[r.date].conversions+=r.conversions||0;
  });
  return {
    totals: T,
    byChannel: Object.values(chMap).sort((a,b)=>b.sessions-a.sessions),
    byDevice: Object.values(devMap),
    daily: Object.values(dateMap).sort((a,b)=>a.date.localeCompare(b.date)),
    rowCount: parsed.length
  };
}
