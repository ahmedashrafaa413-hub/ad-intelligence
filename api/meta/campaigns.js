function getCookie(req, name) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
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

    const url =
      `https://graph.facebook.com/v19.0/${accountId}/campaigns` +
      "?fields=id,name,status,objective,daily_budget,lifetime_budget" +
      "&limit=100" +
      `&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({
        success: false,
        error: data.error
      });
    }

    return res.status(200).json({
      success: true,
      provider: "Meta Ads",
      account_id: accountId,
      data: data.data || []
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
