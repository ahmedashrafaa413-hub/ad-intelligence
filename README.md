# Ad Intelligence Platform 🚀

منصة تحليل الحملات الإعلانية — Meta, Snapchat, TikTok, Google

## النشر على Vercel (5 دقائق)

### الخطوة 1 — رفع على GitHub

```bash
# في Terminal على جهازك
cd ad-intelligence
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ad-intelligence.git
git push -u origin main
```

### الخطوة 2 — ربط Vercel

1. اذهب لـ [vercel.com](https://vercel.com)
2. اضغط **"New Project"**
3. اختر Repository `ad-intelligence`
4. اضغط **Deploy**

### الخطوة 3 — إضافة Environment Variables

في Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `OPENROUTER_KEY` | مفتاح OpenRouter بتاعك |
| `META_TOKEN` | Meta Access Token (اختياري) |

### الخطوة 4 — Redeploy

بعد إضافة المتغيرات، اضغط **Redeploy** وموقعك جاهز! 🎉

---

## الميزات

- 📊 داشبورد تفاعلي مع مخططات
- 🔗 Meta Ads API مباشر
- 🏆 Creative Leaderboard
- 💬 AI Chatbot مع retry تلقائي
- 📋 ريبورت للطباعة
- 🔽 Funnel Analysis
- 🧩 Core Four Framework

## التكنولوجيا

- Frontend: HTML/CSS/JS + Chart.js
- Backend: Vercel Serverless Functions (Node.js)
- AI: OpenRouter (Free Models)
- Ads APIs: Meta Graph API
