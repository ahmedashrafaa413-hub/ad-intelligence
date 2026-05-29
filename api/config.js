module.exports = async (req, res) => {
  res.status(200).json({
    success: true,
    meta_app_id_exists: !!process.env.META_APP_ID,
    meta_app_secret_exists: !!process.env.META_APP_SECRET
  });
};
