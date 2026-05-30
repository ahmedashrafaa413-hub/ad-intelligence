"use client";

import { BarChart3, Brain, CalendarDays, LineChart, PlugZap, Target } from "lucide-react";

export default function HomePage() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">AdIntelligence</div>

        <nav>
          <a className="active">Dashboard</a>
          <a>Campaign Intelligence</a>
          <a>Ad Sets</a>
          <a>Ads</a>
          <a>Media Plan</a>
          <a>ROAS Calculator</a>
          <a>Creative Analysis</a>
          <a>AI Assistant</a>
          <a>Settings</a>
        </nav>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <h1>Marketing Intelligence Platform</h1>
            <p>منصة تحليل أداء إعلاني للميديا بايرز والمعلنين</p>
          </div>

          <a className="connect-btn" href="/api/meta/auth">
            ربط Meta
          </a>
        </header>

        <section className="hero-grid">
          <div className="hero-card">
            <PlugZap />
            <h3>Platform Connectors</h3>
            <p>Meta, TikTok, Snapchat, Google Ads, GA4 قريبًا.</p>
          </div>

          <div className="hero-card">
            <BarChart3 />
            <h3>Performance Intelligence</h3>
            <p>Campaigns, Ad Sets, Ads, Metrics, Trends.</p>
          </div>

          <div className="hero-card">
            <CalendarDays />
            <h3>Media Planning</h3>
            <p>خطط شهرية، Budget Forecast، Tracking.</p>
          </div>

          <div className="hero-card">
            <Brain />
            <h3>AI Media Buyer</h3>
            <p>تحليل، توصيات، أفكار كريتف، تحسين حملات.</p>
          </div>
        </section>

        <section className="dashboard-preview">
          <div className="panel">
            <h2>Live Meta Dashboard</h2>
            <p>الخطوة التالية: هنربط هنا الـ APIs الشغالة لعرض الحسابات، الحملات، Ad Sets، Ads، وكل الميتركس.</p>

            <div className="metrics-row">
              <div>
                <span>Spend</span>
                <strong>$0.00</strong>
              </div>
              <div>
                <span>ROAS</span>
                <strong>0.00x</strong>
              </div>
              <div>
                <span>CPA</span>
                <strong>$0.00</strong>
              </div>
              <div>
                <span>CTR</span>
                <strong>0.00%</strong>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2>Coming Modules</h2>
            <ul>
              <li>Interactive dashboard</li>
              <li>Custom metrics selector</li>
              <li>Campaign / Ad Set / Ad drill-down</li>
              <li>Creative performance analysis</li>
              <li>AI recommendations</li>
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}
