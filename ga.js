import { BetaAnalyticsDataClient } from '@google-analytics/data';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { propertyId, startDate, endDate, metrics, dimensions } = req.body;

  // Get service account from env
  const serviceAccountJson = process.env.GA_SERVICE_ACCOUNT;
  const gaPropertyId = propertyId || process.env.GA_PROPERTY_ID;

  if (!serviceAccountJson) return res.status(500).json({ error: 'GA_SERVICE_ACCOUNT not configured in Vercel' });
  if (!gaPropertyId) return res.status(400).json({ error: 'Property ID required' });

  let credentials;
  try {
    credentials = JSON.parse(serviceAccountJson);
  } catch (e) {
    return res.status(500).json({ error: 'Invalid GA_SERVICE_ACCOUNT JSON format' });
  }

  try {
    const analyticsClient = new BetaAnalyticsDataClient({ credentials });

    const defaultMetrics = [
      'sessions', 'totalUsers', 'newUsers', 'bounceRate',
      'averageSessionDuration', 'screenPageViews',
      'conversions', 'totalRevenue', 'ecommercePurchases',
      'addToCarts', 'checkouts', 'cartToViewRate', 'purchaseToViewRate'
    ];

    const defaultDimensions = ['date', 'sessionDefaultChannelGroup', 'deviceCategory'];

    const [response] = await analyticsClient.runReport({
      property: `properties/${gaPropertyId}`,
      dateRanges: [{ startDate: startDate || '30daysAgo', endDate: endDate || 'today' }],
      metrics: (metrics || defaultMetrics).map(m => ({ name: m })),
      dimensions: (dimensions || defaultDimensions).map(d => ({ name: d })),
    });

    // Process rows
    const rows = (response.rows || []).map(row => {
      const obj = {};
      (response.dimensionHeaders || []).forEach((h, i) => {
        obj[h.name] = row.dimensionValues?.[i]?.value || '';
      });
      (response.metricHeaders || []).forEach((h, i) => {
        obj[h.name] = parseFloat(row.metricValues?.[i]?.value || 0);
      });
      return obj;
    });

    // Aggregate totals
    const totals = rows.reduce((acc, row) => {
      acc.sessions += row.sessions || 0;
      acc.users += row.totalUsers || 0;
      acc.newUsers += row.newUsers || 0;
      acc.pageViews += row.screenPageViews || 0;
      acc.conversions += row.conversions || 0;
      acc.revenue += row.totalRevenue || 0;
      acc.purchases += row.ecommercePurchases || 0;
      acc.addToCarts += row.addToCarts || 0;
      acc.checkouts += row.checkouts || 0;
      return acc;
    }, { sessions: 0, users: 0, newUsers: 0, pageViews: 0, conversions: 0, revenue: 0, purchases: 0, addToCarts: 0, checkouts: 0 });

    // Funnel rates
    totals.bounceRate = rows.length > 0 ? (rows.reduce((a, r) => a + (r.bounceRate || 0), 0) / rows.length).toFixed(2) : 0;
    totals.avgSessionDuration = rows.length > 0 ? (rows.reduce((a, r) => a + (r.averageSessionDuration || 0), 0) / rows.length).toFixed(0) : 0;
    totals.atcRate = totals.sessions > 0 ? +((totals.addToCarts / totals.sessions) * 100).toFixed(2) : 0;
    totals.checkoutRate = totals.addToCarts > 0 ? +((totals.checkouts / totals.addToCarts) * 100).toFixed(2) : 0;
    totals.purchaseRate = totals.checkouts > 0 ? +((totals.purchases / totals.checkouts) * 100).toFixed(2) : 0;
    totals.cvr = totals.sessions > 0 ? +((totals.purchases / totals.sessions) * 100).toFixed(2) : 0;
    totals.newUserPct = totals.users > 0 ? +((totals.newUsers / totals.users) * 100).toFixed(1) : 0;

    // By channel
    const byChannel = {};
    rows.forEach(row => {
      const ch = row.sessionDefaultChannelGroup || 'Other';
      if (!byChannel[ch]) byChannel[ch] = { channel: ch, sessions: 0, users: 0, conversions: 0, revenue: 0 };
      byChannel[ch].sessions += row.sessions || 0;
      byChannel[ch].users += row.totalUsers || 0;
      byChannel[ch].conversions += row.conversions || 0;
      byChannel[ch].revenue += row.totalRevenue || 0;
    });

    // By device
    const byDevice = {};
    rows.forEach(row => {
      const dev = row.deviceCategory || 'other';
      if (!byDevice[dev]) byDevice[dev] = { device: dev, sessions: 0, users: 0 };
      byDevice[dev].sessions += row.sessions || 0;
      byDevice[dev].users += row.totalUsers || 0;
    });

    // Daily trend
    const byDate = {};
    rows.forEach(row => {
      if (!row.date) return;
      if (!byDate[row.date]) byDate[row.date] = { date: row.date, sessions: 0, users: 0, conversions: 0 };
      byDate[row.date].sessions += row.sessions || 0;
      byDate[row.date].users += row.totalUsers || 0;
      byDate[row.date].conversions += row.conversions || 0;
    });

    res.json({
      totals,
      byChannel: Object.values(byChannel).sort((a, b) => b.sessions - a.sessions),
      byDevice: Object.values(byDevice),
      daily: Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)),
      rowCount: rows.length
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
