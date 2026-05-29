module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    service: "AdIntelligence Config",
    meta_app_id_exists: !!process.env.META_APP_ID,
    supabase_url_exists: !!process.env.SUPABASE_URL
  });
};
