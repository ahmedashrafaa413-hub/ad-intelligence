export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const ga_sa = process.env.GA_SERVICE_ACCOUNT;
  const ga_prop = process.env.GA_PROPERTY_ID;
  
  res.status(200).json({
    status: 'ok',
    ga_service_account: ga_sa ? 'موجود (' + ga_sa.length + ' chars)' : 'غير موجود ❌',
    ga_property_id: ga_prop ? ga_prop : 'غير موجود ❌',
    ga_starts_with: ga_sa ? ga_sa.substring(0, 20) : 'N/A',
    openrouter: process.env.OPENROUTER_KEY ? 'موجود ✅' : 'غير موجود',
    node_version: process.version
  });
}
