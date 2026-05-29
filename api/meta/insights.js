function getCookie(req, name) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

module.exports = async (req, res) => {
  try {
    const token = req.query.token || getCookie(req, "meta_token");
    const accountId = req.query.account_id;
    const level = req.query.level || "campaign";
    const datePreset = req.query.date_preset || "last_30d";

    if (!token) return res.status(401).json({ success:false, error:"Not connected to Meta" });
    if (!accountId) return res.status(400).json({ success:false, error:"account_id is required" });

    const defaultFields = [
      "campaign_id","campaign_name",
      "adset_id","adset_name",
      "ad_id","ad_name",
      "spend","impressions","reach","frequency",
      "clicks","inline_link_clicks","outbound_clicks",
      "ctr","cpc","cpm","cpp",
      "actions","action_values","cost_per_action_type",
      "purchase_roas",
      "date_start","date_stop"
    ];

    const fields = req.query.fields
      ? req.query.fields
      : defaultFields.join(",");

    const url =
      `https://graph.facebook.com/v19.0/${accountId}/insights` +
      `?fields=${encodeURIComponent(fields)}` +
      `&level=${encodeURIComponent(level)}` +
      `&date_preset=${encodeURIComponent(datePreset)}` +
      `&limit=200` +
      `&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) return res.status(400).json({ success:false, error:data.error });

    return res.status(200).json({
      success: true,
      provider: "Meta Ads",
      account_id: accountId,
      level,
      date_preset: datePreset,
      data: data.data || [],
      paging: data.paging || null
    });

  } catch (error) {
    return res.status(500).json({ success:false, error:error.message });
  }
};
