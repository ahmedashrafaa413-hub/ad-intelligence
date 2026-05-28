import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { platform, workspace_id, account_id, token, date_from, date_to, action } = req.body || {};

  // ── GET: Status check ──
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('workspace_id', workspace_id || 'default')
      .order('created_at', { ascending: false })
      .limit(10);
    return res.status(200).json({ jobs: data || [], error });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── SAVE TOKEN ──
  if (action === 'save_token') {
    const { error } = await supabase
      .from('connected_accounts')
      .upsert({
        workspace_id: workspace_id || 'default',
        platform,
        account_id,
        account_name: req.body.account_name || account_id,
        access_token: token,
        refresh_token: req.body.refresh_token || null,
        status: 'active',
        updated_at: new Date().toISOString()
      }, { onConflict: 'workspace_id,platform,account_id' });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, message: 'Token saved!' });
  }

  // ── SYNC META ──
  if (action === 'sync_meta') {
    const accToken = token || await getToken(supabase, workspace_id, 'meta', account_id);
    if (!accToken) return res.status(400).json({ error: 'No Meta token found' });

    const since = date_from || getDateDaysAgo(30);
    const until = date_to || today();
    const cleanAcc = account_id.replace('act_', '');

    // Create sync job
    const { data: job } = await supabase
      .from('sync_jobs')
      .insert({
        workspace_id: workspace_id || 'default',
        platform: 'meta',
        job_type: 'manual',
        status: 'running',
        date_from: since,
        date_to: until,
        started_at: new Date().toISOString()
      })
      .select().single();

    try {
      // Fetch from Meta API
      const fields = 'spend,impressions,clicks,actions,action_values,cpc,cpm,ctr,date_start,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name';
      const url = `https://graph.facebook.com/v19.0/act_${cleanAcc}/insights?fields=${encodeURIComponent(fields)}&level=ad&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}&time_increment=1&limit=500&access_token=${accToken}`;

      let rows = [];
      let nextUrl = url;

      while (nextUrl) {
        const metaRes = await fetch(nextUrl);
        const metaData = await metaRes.json();
        if (metaData.error) throw new Error(metaData.error.message);
        rows = rows.concat(metaData.data || []);
        nextUrl = metaData.paging?.next || null;
        if (rows.length > 10000) break; // Safety limit
      }

      // Normalize & upsert
      const getAV = (arr, type) => {
        if (!Array.isArray(arr)) return 0;
        const a = arr.find(x => x.action_type === type || String(x.action_type).includes(type));
        return a ? parseFloat(a.value) : 0;
      };

      const normalized = rows.map(r => {
        const spend = parseFloat(r.spend) || 0;
        const impressions = parseInt(r.impressions) || 0;
        const clicks = parseInt(r.clicks) || 0;
        const conversions = getAV(r.actions, 'purchase');
        const revenue = getAV(r.action_values, 'purchase');
        const add_to_carts = getAV(r.actions, 'add_to_cart');
        const checkouts = getAV(r.actions, 'initiate_checkout');

        return {
          workspace_id: workspace_id || 'default',
          platform: 'meta',
          account_id: cleanAcc,
          date: r.date_start,
          campaign_id: r.campaign_id,
          campaign_name: r.campaign_name,
          adset_id: r.adset_id,
          adset_name: r.adset_name,
          ad_id: r.ad_id,
          ad_name: r.ad_name,
          impressions,
          clicks,
          spend,
          conversions: Math.round(conversions),
          revenue,
          add_to_carts: Math.round(add_to_carts),
          checkouts: Math.round(checkouts),
          ctr: impressions > 0 ? +(clicks / impressions * 100).toFixed(4) : 0,
          cpc: clicks > 0 ? +(spend / clicks).toFixed(4) : 0,
          cpm: impressions > 0 ? +(spend / impressions * 1000).toFixed(4) : 0,
          cpa: conversions > 0 ? +(spend / conversions).toFixed(4) : 0,
          roas: spend > 0 ? +(revenue / spend).toFixed(4) : 0,
          cvr: clicks > 0 ? +(conversions / clicks * 100).toFixed(4) : 0,
          currency: 'USD',
          raw_data: r,
          synced_at: new Date().toISOString()
        };
      });

      // Batch upsert (50 at a time)
      let upserted = 0;
      for (let i = 0; i < normalized.length; i += 50) {
        const batch = normalized.slice(i, i + 50);
        const { error: uErr } = await supabase
          .from('fact_performance')
          .upsert(batch, { onConflict: 'workspace_id,platform,account_id,date,campaign_id,adset_id,ad_id' });
        if (!uErr) upserted += batch.length;
      }

      // Update job status
      await supabase.from('sync_jobs').update({
        status: 'success',
        rows_processed: upserted,
        finished_at: new Date().toISOString()
      }).eq('id', job?.id);

      return res.status(200).json({
        success: true,
        rows_fetched: rows.length,
        rows_saved: upserted,
        date_from: since,
        date_to: until
      });

    } catch (e) {
      await supabase.from('sync_jobs').update({
        status: 'failed',
        error_message: e.message,
        finished_at: new Date().toISOString()
      }).eq('id', job?.id);

      return res.status(500).json({ error: e.message });
    }
  }

  // ── SYNC GA4 ──
  if (action === 'sync_ga4') {
    const prop = req.body.property_id || process.env.GA_PROPERTY_ID;
    if (!prop) return res.status(400).json({ error: 'No GA4 Property ID' });

    const since = date_from || getDateDaysAgo(30);
    const until = date_to || today();

    try {
      // Get GA4 data via existing /api/ga
      const gaRes = await fetch(`${process.env.VERCEL_URL || 'https://ad-intelligence-an2i.vercel.app'}/api/ga`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: prop, startDate: since, endDate: until })
      });
      const gaText = await gaRes.text();
      if (!gaText) throw new Error('GA API empty response');
      const gaData = JSON.parse(gaText);
      if (gaData.error) throw new Error(gaData.error);

      // Upsert GA4 data
      const rows = (gaData.daily || []).map(d => ({
        workspace_id: workspace_id || 'default',
        property_id: prop,
        date: d.date?.length === 8 ?
          `${d.date.slice(0,4)}-${d.date.slice(4,6)}-${d.date.slice(6,8)}` : d.date,
        sessions: d.sessions || 0,
        users: d.users || 0,
        conversions: d.conversions || 0,
        synced_at: new Date().toISOString()
      }));

      let saved = 0;
      for (let i = 0; i < rows.length; i += 50) {
        const { error } = await supabase
          .from('fact_ga4')
          .upsert(rows.slice(i, i + 50), { onConflict: 'workspace_id,property_id,date,channel,device' });
        if (!error) saved += Math.min(50, rows.length - i);
      }

      return res.status(200).json({ success: true, rows_saved: saved });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── GET PERFORMANCE DATA ──
  if (action === 'get_performance') {
    const { data, error } = await supabase
      .from('fact_performance')
      .select('date,platform,campaign_name,spend,revenue,clicks,conversions,roas,cpa,impressions')
      .eq('workspace_id', workspace_id || 'default')
      .gte('date', date_from || getDateDaysAgo(30))
      .lte('date', date_to || today())
      .order('date', { ascending: false })
      .limit(1000);

    return res.status(200).json({ data: data || [], error });
  }

  return res.status(400).json({ error: 'Unknown action. Use: save_token, sync_meta, sync_ga4, get_performance' });
}

// ── Helpers ──
async function getToken(supabase, workspaceId, platform, accountId) {
  const { data } = await supabase
    .from('connected_accounts')
    .select('access_token')
    .eq('workspace_id', workspaceId || 'default')
    .eq('platform', platform)
    .eq('account_id', accountId)
    .single();
  return data?.access_token;
}

function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}
