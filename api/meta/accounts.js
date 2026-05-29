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
        error: "Not connected to Meta"
      });
    }

    const url =
      "https://graph.facebook.com/v19.0/me/adaccounts" +
      "?fields=id,name,account_status,currency" +
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
      data: data.data || []
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
