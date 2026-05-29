function getCookie(req, name) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

module.exports = async (req, res) => {
  try {
    const token = req.query.token || getCookie(req, "meta_token");
    const accountId = req.query.account_id;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not connected to Meta"
      });
    }

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: "account_id is required"
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
