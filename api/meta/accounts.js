const fetch = require("node-fetch");

module.exports = async (req, res) => {
  try {
    const token = req.query.token;

    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?access_token=${token}`
    );

    const data = await response.json();

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};
