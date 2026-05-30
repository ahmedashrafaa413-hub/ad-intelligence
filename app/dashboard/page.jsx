"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";
import { getSetting, saveSetting } from "../../lib/storage";

const metrics = [
  { key: "spend", label: "Spend", icon: "💰", format: "money" },
  { key: "impressions", label: "Impressions", icon: "👁️", format: "number" },
  { key: "clicks", label: "Clicks", icon: "🖱️", format: "number" },
  { key: "ctr", label: "CTR", icon: "📈", format: "percent" }
];

function formatValue(value, type) {
  const num = Number(value || 0);

  if (type === "money") return `$${num.toFixed(2)}`;
  if (type === "percent") return `${num.toFixed(2)}%`;

  return num.toLocaleString();
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [level, setLevel] = useState("campaign");
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("Loading...");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (accountId) {
      loadInsights(accountId, level);
    }
  }, [accountId, level]);

  async function loadAccounts() {
    try {
      setError("");

      const data = await apiGet("/api/meta/accounts");
      const list = data.data || [];

      const saved = getSetting("primary_meta_account", "");
      const selected = saved || list[0]?.id || "";

      setAccounts(list);
      setAccountId(selected);
      setStatus("Accounts loaded");
    } catch (err) {
      setError(err.message || "Failed to load accounts");
      setStatus("Connection error");
    }
  }

  async function loadInsights(selectedAccount = accountId, selectedLevel = level) {
    try {
      setError("");
      setStatus("Loading performance data...");

      const data = await apiGet(
        `/api/meta/insights?account_id=${selectedAccount}&level=${selectedLevel}`
      );

      setRows(data.data || []);
      setStatus("Dashboard updated");
    } catch (err) {
      setRows([]);
      setError(err.message || "Failed to load insights");
      setStatus("Failed to load data");
    }
  }

  function changeAccount(value) {
    setAccountId(value);
    saveSetting("primary_meta_account", value);
  }

  const totals = useMemo(() => {
    const total = rows.reduce(
      (acc, row) => {
        acc.spend += Number(row.spend || 0);
        acc.impressions += Number(row.impressions || 0);
        acc.clicks += Number(row.clicks || 0);
        acc.reach += Number(row.reach || 0);
        return acc;
      },
      { spend: 0, impressions: 0, clicks: 0, reach: 0 }
    );

    return {
      ...total,
      ctr: total.impressions ? (total.clicks / total.impressions) * 100 : 0,
      cpc: total.clicks ? total.spend / total.clicks : 0,
      cpm: total.impressions ? (total.spend / total.impressions) * 1000 : 0
    };
  }, [rows]);

  const nameKey =
    level === "ad"
      ? "ad_name"
      : level === "adset"
      ? "adset_name"
      : "campaign_name";

  return (
    <main className="dash-page">
      <header className="dash-top">
        <div>
          <span className="eyebrow">Meta Ads Intelligence</span>
          <h1>Dashboard</h1>
          <p>تحليل مباشر لأداء الحملات، الـ Ad Sets، والإعلانات.</p>
        </div>

        <button className="primary-btn" onClick={() => loadInsights()}>
          Refresh
        </button>
      </header>

      <section className="dash-controls">
        <div className="control-box">
          <label>Ad Account</label>

          <select
            value={accountId}
            onChange={(e) => changeAccount(e.target.value)}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} - {acc.currency}
              </option>
            ))}
          </select>
        </div>

        <div className="control-box">
          <label>View Level</label>

          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="campaign">Campaigns</option>
            <option value="adset">Ad Sets</option>
            <option value="ad">Ads</option>
          </select>
        </div>
      </section>

      <p className={error ? "dash-error" : "dash-status"}>
        {error || status}
      </p>

      <section className="kpi-grid">
        {metrics.map((metric) => (
          <div className="kpi-card-pro" key={metric.key}>
            <div className="kpi-icon">{metric.icon}</div>
            <span>{metric.label}</span>
            <strong>{formatValue(totals[metric.key], metric.format)}</strong>
          </div>
        ))}
      </section>

      <section className="table-panel">
        <div className="panel-head">
          <div>
            <h2>
              {level === "ad"
                ? "Ads Performance"
                : level === "adset"
                ? "Ad Sets Performance"
                : "Campaigns Performance"}
            </h2>

            <p>{rows.length} rows loaded</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state">
            <h3>No data yet</h3>
            <p>اختار حساب إعلاني أو اضغط Refresh لعرض البيانات.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Spend</th>
                  <th>Impressions</th>
                  <th>Reach</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>CPC</th>
                  <th>CPM</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => {
                  const impressions = Number(row.impressions || 0);
                  const clicks = Number(row.clicks || 0);
                  const spend = Number(row.spend || 0);

                  const ctr = impressions ? (clicks / impressions) * 100 : 0;
                  const cpc = clicks ? spend / clicks : 0;
                  const cpm = impressions ? (spend / impressions) * 1000 : 0;

                  return (
                    <tr key={index}>
                      <td className="name-cell">
                        {row[nameKey] || "Unknown"}
                      </td>
                      <td>{formatValue(spend, "money")}</td>
                      <td>{formatValue(impressions, "number")}</td>
                      <td>{formatValue(row.reach, "number")}</td>
                      <td>{formatValue(clicks, "number")}</td>
                      <td>{formatValue(ctr, "percent")}</td>
                      <td>{formatValue(cpc, "money")}</td>
                      <td>{formatValue(cpm, "money")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
