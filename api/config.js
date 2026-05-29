module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    meta_app_id: process.env.META_APP_ID || null,
    supabase_connected: !!process.env.SUPABASE_URL
  });
};
