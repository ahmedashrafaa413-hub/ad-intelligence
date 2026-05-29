module.exports = async (req, res) => {
  try {
    const accessToken = req.cookies?.meta_access_token;

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Not connected to Meta"
      });
    }

    const accountId = req.query.account_id;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: "account_id is required"
      });
    }

    const url =
      `https://graph.facebook.com/v19.0/${accountId}/insights` +
      `?fields=campaign_name,spend,impressions,reach,clicks,cpc,cpm,ctr` +
      `&date_preset=last_30d` +
      `&access_token=${accessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    return res.status(200).json({
      success: true,
      provider: "Meta Ads",
      account_id: accountId,
      data: data.data || [],
      paging: data.paging || null
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
