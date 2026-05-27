export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, model } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages required' });

  const FREE_MODELS = [
    'mistralai/mistral-7b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-3-1b-it:free',
    'qwen/qwen-2.5-7b-instruct:free'
  ];

  const selectedModel = model || FREE_MODELS[0];
  const key = process.env.OPENROUTER_KEY;

  if (!key) return res.status(500).json({ error: 'AI key not configured' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://ad-intelligence.vercel.app',
        'X-Title': 'Ad Intelligence Platform'
      },
      body: JSON.stringify({ model: selectedModel, messages, max_tokens: 1200, temperature: 0.7 })
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    res.json({ content: data.choices?.[0]?.message?.content || '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
