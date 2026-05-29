function getCookie(req, name) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function findActionValue(items, actionTypes) {
  if (!Array.isArray(items)) return 0;

  const found = items.find((item) =>
    actionTypes.includes(item.action_type)
  );

  return Number(found?.value || 0);
}

module.exports = async (req, res) => {
  try {
    const token = req.query.token || getCookie(req, "meta_token");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Meta token is missing. Please reconnect Meta."
      });
    }

    let accountId = req.query.accountId;

    if (!accountId) {
      const accountsRes = await fetch(
        "https://graph.facebook.com/v19.0/me/adaccounts" +
          "?fields=id,name,currency" +
          `&access_token=${encodeURIComponent(token)}`
      );

      const accountsData = await accountsRes.json();

      if (accountsData.error) {
        return res.status(400).json({
          success: false,
          error: accountsData.error
        });
      }

      accountId = accountsData.data?.[0]?.id;
    }

    if (!accountId) {
      return res.status(404).json({
        success: false,
        error: "No Meta ad account found"
      });
    }

    const level = req.query.level || "campaign";
    const datePreset = req.query.date_preset || "last_30d";

    const fields = [
      "campaign_id",
      "campaign_name",
      "spend",
      "impressions",
      "reach",
      "clicks",
      "cpm",
      "cpc",
      "ctr",
      "actions",
      "action_values"
    ].join(",");

    const url =
      `https://graph.facebook.com/v19.0/${accountId}/insights` +
      `?fields=${encodeURIComponent(fields)}` +
      `&level=${encodeURIComponent(level)}` +
      `&date_preset=${encodeURIComponent(datePreset)}` +
      "&limit=100" +
      `&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(url);
    const raw = await response.json();

    if (raw.error) {
      return res.status(400).json({
        success: false,
        error: raw.error
      });
    }

    const purchaseActionTypes = [
      "purchase",
      "omni_purchase",
      "offsite_conversion.fb_pixel_purchase"
    ];

    const data = (raw.data || []).map((row) => {
      const spend = Number(row.spend || 0);
      const purchases = findActionValue(row.actions, purchaseActionTypes);
      const revenue = findActionValue(row.action_values, purchaseActionTypes);

      return {
        campaign_id: row.campaign_id || null,
        campaign_name: row.campaign_name || null,
        spend,
        impressions: Number(row.impressions || 0),
        reach: Number(row.reach || 0),
        clicks: Number(row.clicks || 0),
        cpm: Number(row.cpm || 0),
        cpc: Number(row.cpc || 0),
        ctr: Number(row.ctr || 0),
        purchases,
        revenue,
        roas: spend > 0 ? Number((revenue / spend).toFixed(2)) : 0,
        cpa: purchases > 0 ? Number((spend / purchases).toFixed(2)) : 0
      };
    });

    return res.status(200).json({
      success: true,
      provider: "Meta Ads",
      account_id: accountId,
      level,
      date_preset: datePreset,
      data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
