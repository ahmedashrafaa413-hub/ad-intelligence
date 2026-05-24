export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    const propertyId = body?.propertyId || process.env.GA_PROPERTY_ID;
    const startDate = body?.startDate || '30daysAgo';
    const endDate = body?.endDate || 'today';

    const serviceAccountJson = process.env.GA_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      return res.status(500).json({ error: 'GA_SERVICE_ACCOUNT not configured in Vercel Environment Variables' });
    }
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID required' });
    }

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid GA_SERVICE_ACCOUNT JSON: ' + e.message });
    }

    // Get access token via JWT
    const jwt = await getJWT(credentials);
    const accessToken = await getAccessToken(jwt);

    // Call GA4 Data API
    const apiUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
    const gaRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [
          { startDate, endDate },
          { startDate: getPrevStartDate(startDate), endDate: getPrevEndDate(startDate) }
        ],
        dimensions: [
          { name: 'date' },
          { name: 'sessionDefaultChannelGroup' },
          { name: 'deviceCategory' }
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'newUsers' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'screenPageViews' },
          { name: 'conversions' },
          { name: 'totalRevenue' },
          { name: 'ecommercePurchases' },
          { name: 'addToCarts' },
          { name: 'checkouts' }
        ]
      })
    });

    if (!gaRes.ok) {
      const errText = await gaRes.text();
      return res.status(gaRes.status).json({ error: 'GA API error: ' + errText.slice(0, 500) });
    }

    const gaData = await gaRes.json();
    const processed = processGA(gaData);
    return res.status(200).json(processed);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// ── JWT & Auth ──
async function getJWT(creds) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signing = `${b64(header)}.${b64(payload)}`;

  // Use crypto to sign
  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(signing);
  const signature = sign.sign(creds.private_key, 'base64url');
  return `${signing}.${signature}`;
}

async function getAccessToken(jwt) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get access token: ' + JSON.stringify(data));
  return data.access_token;
}

function getPrevStartDate(startDate) {
  if (startDate.endsWith('daysAgo')) {
    const days = parseInt(startDate) * 2;
    return `${days}daysAgo`;
  }
  return startDate;
}
function getPrevEndDate(startDate) {
  if (startDate.endsWith('daysAgo')) {
    const days = parseInt(startDate);
    return `${days}daysAgo`;
  }
  return startDate;
}

// ── Process GA Response ──
function processGA(data) {
  const rows = data.rows || [];
  const dimHeaders = (data.dimensionHeaders || []).map(h => h.name);
  const metHeaders = (data.metricHeaders || []).map(h => h.name);

  const parsed = rows.map(row => {
    const obj = {};
    dimHeaders.forEach((h, i) => { obj[h] = row.dimensionValues?.[i]?.value || ''; });
    metHeaders.forEach((h, i) => { obj[h] = parseFloat(row.metricValues?.[i]?.value || 0); });
    return obj;
  });

  // Filter current period only (dateRange index 0)
  const current = parsed.filter(r => !r.dateRange || r.dateRange !== 'date_range_1');

  const totals = { sessions:0,users:0,newUsers:0,pageViews:0,conversions:0,revenue:0,purchases:0,addToCarts:0,checkouts:0,bounceRate:0,avgDuration:0 };
  let bRateCount = 0, durCount = 0;

  current.forEach(r => {
    totals.sessions += r.sessions||0;
    totals.users += r.totalUsers||0;
    totals.newUsers += r.newUsers||0;
    totals.pageViews += r.screenPageViews||0;
    totals.conversions += r.conversions||0;
    totals.revenue += r.totalRevenue||0;
    totals.purchases += r.ecommercePurchases||0;
    totals.addToCarts += r.addToCarts||0;
    totals.checkouts += r.checkouts||0;
    if(r.bounceRate > 0){ totals.bounceRate += r.bounceRate; bRateCount++; }
    if(r.averageSessionDuration > 0){ totals.avgDuration += r.averageSessionDuration; durCount++; }
  });

  totals.bounceRate = bRateCount > 0 ? +(totals.bounceRate / bRateCount * 100).toFixed(2) : 0;
  totals.avgSessionDuration = durCount > 0 ? +(totals.avgDuration / durCount).toFixed(0) : 0;
  totals.cvr = totals.sessions > 0 ? +(totals.purchases / totals.sessions * 100).toFixed(2) : 0;
  totals.newUserPct = totals.users > 0 ? +(totals.newUsers / totals.users * 100).toFixed(1) : 0;
  totals.atcRate = totals.sessions > 0 ? +(totals.addToCarts / totals.sessions * 100).toFixed(2) : 0;
  totals.checkoutRate = totals.addToCarts > 0 ? +(totals.checkouts / totals.addToCarts * 100).toFixed(2) : 0;
  totals.purchaseRate = totals.checkouts > 0 ? +(totals.purchases / totals.checkouts * 100).toFixed(2) : 0;

  // By channel
  const chMap = {};
  current.forEach(r => {
    const ch = r.sessionDefaultChannelGroup || 'Other';
    if(!chMap[ch]) chMap[ch] = { channel:ch, sessions:0, users:0, conversions:0, revenue:0 };
    chMap[ch].sessions += r.sessions||0;
    chMap[ch].users += r.totalUsers||0;
    chMap[ch].conversions += r.conversions||0;
    chMap[ch].revenue += r.totalRevenue||0;
  });

  // By device
  const devMap = {};
  current.forEach(r => {
    const dev = r.deviceCategory || 'other';
    if(!devMap[dev]) devMap[dev] = { device:dev, sessions:0, users:0 };
    devMap[dev].sessions += r.sessions||0;
    devMap[dev].users += r.totalUsers||0;
  });

  // Daily
  const dateMap = {};
  current.forEach(r => {
    if(!r.date) return;
    if(!dateMap[r.date]) dateMap[r.date] = { date:r.date, sessions:0, users:0, conversions:0 };
    dateMap[r.date].sessions += r.sessions||0;
    dateMap[r.date].users += r.totalUsers||0;
    dateMap[r.date].conversions += r.conversions||0;
  });

  return {
    totals,
    byChannel: Object.values(chMap).sort((a,b) => b.sessions - a.sessions),
    byDevice: Object.values(devMap),
    daily: Object.values(dateMap).sort((a,b) => a.date.localeCompare(b.date)),
    rowCount: current.length
  };
}
