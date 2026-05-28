const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = async function handler(req, res) {
  try {
    const result = await pool.query("SELECT NOW()");

    return res.status(200).json({
      success: true,
      message: "API is running 🚀",
      database: "Connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
