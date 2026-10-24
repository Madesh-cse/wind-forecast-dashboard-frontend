
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "./api/client";
import type { WindAnalysis } from "./types/analysis";
import "./App.css";

const nf = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 1,
});

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "N/A";
  return nf.format(value);
}

function formatSigned(value: number | null | undefined) {
  if (value === null || value === undefined) return "N/A";
  return `${value > 0 ? "+" : ""}${nf.format(value)}`;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <p className="tooltip-time">{label}</p>
      {payload.map((item: any) => (
        <div key={item.dataKey} className="tooltip-row">
          <span
            className="tooltip-dot"
            style={{ background: item.color }}
          />
          <span>{item.name}</span>
          <strong>{formatNumber(item.value)} MW</strong>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [analysis, setAnalysis] = useState<WindAnalysis | null>(null);
  const [cutoff, setCutoff] = useState("12:00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAnalysis() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<WindAnalysis>(
          "/api/wind/analysis",
          { params: { cutoff } },
        );

        if (active) setAnalysis(response.data);
      } catch {
        if (active) {
          setError(
            "We couldn't load the analysis. Check the backend connection and try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAnalysis();

    return () => {
      active = false;
    };
  }, [cutoff, reloadKey]);

  const chartData = (analysis?.data ?? []).map((row) => ({
    ...row,
    time: new Date(row.startTime).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/London",
    }),
  }));

  const biasDirection =
    analysis?.bias == null
      ? "Not available"
      : analysis.bias > 0
        ? "Over-forecasting"
        : analysis.bias < 0
          ? "Under-forecasting"
          : "Balanced";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Windscope home">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M5 21.5 12.2 14l5.2 5.1L27 8.5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.5 8.5H27V15"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="brand-copy">
            <strong>Windscope</strong>
            <small>ENERGY INTELLIGENCE</small>
          </span>
        </a>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#overview" aria-current="page">
            <span className="nav-icon">▦</span>
            Overview
          </a>
          <a className="nav-item" href="#forecast">
            <span className="nav-icon">⌁</span>
            Forecast analysis
          </a>
          <a className="nav-item" href="#intervals">
            <span className="nav-icon">▤</span>
            Delivery intervals
          </a>
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-status">
          <span className="status-dot" />
          <div>
            <strong>Analytics service</strong>
            <small>{error ? "Connection issue" : "Connected to dashboard"}</small>
          </div>
        </div>

        <div className="sidebar-footer">
          <span className="avatar">WI</span>
          <div className="profile-copy">
            <strong>Energy analytics</strong>
            <small>Analyst workspace</small>
          </div>
          <span className="profile-menu" aria-hidden="true">···</span>
        </div>
      </aside>

      <main className="main-area" id="overview">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-icon" aria-hidden="true">↗</span>
            <strong>Windscope</strong>
          </div>

          <div className="breadcrumbs">
            <span>Analytics</span>
            <span className="breadcrumb-separator">/</span>
            <strong>Wind forecast accuracy</strong>
          </div>

          <div className="topbar-right">
            <span className="environment-label">PRODUCTION DATA</span>
            <span className="topbar-divider" />
            <span className="topbar-period">January 2026</span>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-mark" />
                RENEWABLES / PERFORMANCE
              </div>
              <h1>Wind forecast accuracy</h1>
              <p className="page-description">
                Measure day-ahead forecast performance against actual UK wind
                generation.
              </p>
            </div>

            <div className="report-controls">
              <label className="cutoff-control">
                <span>Decision cutoff</span>
                <span className="input-with-icon">
                  <span aria-hidden="true">◷</span>
                  <input
                    type="time"
                    value={cutoff}
                    onChange={(event) => setCutoff(event.target.value)}
                  />
                </span>
              </label>

              <button
                type="button"
                className="primary-button"
                onClick={retry}
                disabled={loading}
              >
                <span aria-hidden="true">↻</span>
                {loading ? "Refreshing…" : "Refresh data"}
              </button>
            </div>
          </section>

          <div className="context-banner" role="note">
            <span className="banner-icon" aria-hidden="true">i</span>
            <p>
              Evaluation period: <strong>1–31 January 2026</strong>.
              Cutoff uses Europe/London local time on the previous day.
              <span className="banner-note">
                This cutoff is an illustrative assumption, not a verified
                market deadline.
              </span>
            </p>
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <div>
                <strong>Analysis temporarily unavailable</strong>
                <p>{error}</p>
              </div>
              <button className="secondary-button" onClick={retry} type="button">
                Try again
              </button>
            </div>
          )}

          {loading && !analysis && (
            <div className="metric-grid" aria-busy="true" aria-label="Loading analysis">
              {[1, 2, 3, 4].map((item) => (
                <div className="metric-card skeleton-card" key={item}>
                  <div className="skeleton-line short" />
                  <div className="skeleton-line large" />
                  <div className="skeleton-line medium" />
                </div>
              ))}
              <div className="panel skeleton-panel">
                <div className="skeleton-line medium" />
                <div className="skeleton-chart" />
              </div>
            </div>
          )}

          {analysis && (
            <div className={loading ? "dashboard-content is-stale" : "dashboard-content"}>
              <section className="section-heading">
                <div>
                  <h2>Performance summary</h2>
                  <p>Key metrics for eligible forecast and actual pairs.</p>
                </div>
                <span className="read-only-label">
                  <span className="status-dot" />
                  Historical analysis
                </span>
              </section>

              <section className="metric-grid" aria-label="Accuracy metrics">
                <article className="metric-card">
                  <div className="metric-topline">
                    <span className="metric-label">Mean absolute error</span>
                    <span className="metric-icon teal">MAE</span>
                  </div>
                  <div className="metric-value">
                    {formatNumber(analysis.mae)}
                    <span className="metric-unit">MW</span>
                  </div>
                  <p className="metric-description">
                    Average absolute forecast error
                  </p>
                  <div className="metric-footnote">Lower is better</div>
                </article>

                <article className="metric-card">
                  <div className="metric-topline">
                    <span className="metric-label">Root mean squared error</span>
                    <span className="metric-icon blue">RMSE</span>
                  </div>
                  <div className="metric-value">
                    {formatNumber(analysis.rmse)}
                    <span className="metric-unit">MW</span>
                  </div>
                  <p className="metric-description">
                    Penalises larger forecast misses
                  </p>
                  <div className="metric-footnote">Lower is better</div>
                </article>

                <article className="metric-card">
                  <div className="metric-topline">
                    <span className="metric-label">Forecast bias</span>
                    <span className="metric-icon amber">BIAS</span>
                  </div>
                  <div className="metric-value">
                    {formatSigned(analysis.bias)}
                    <span className="metric-unit">MW</span>
                  </div>
                  <p className="metric-description">
                    {biasDirection} on average
                  </p>
                  <div className="metric-footnote">
                    {analysis.bias != null && analysis.bias > 0
                      ? "Forecast exceeds actual"
                      : analysis.bias != null && analysis.bias < 0
                        ? "Forecast below actual"
                        : "Direction of average error"}
                  </div>
                </article>

                <article className="metric-card">
                  <div className="metric-topline">
                    <span className="metric-label">Matched intervals</span>
                    <span className="metric-icon violet">DATA</span>
                  </div>
                  <div className="metric-value">
                    {nf.format(analysis.matchedCount)}
                  </div>
                  <p className="metric-description">
                    Delivery periods evaluated
                  </p>
                  <div className="metric-footnote">
                    {nf.format(analysis.missingForecastCount)} without an
                    eligible forecast
                  </div>
                </article>
              </section>

              <section className="panel chart-panel" id="forecast">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">GENERATION PROFILE</div>
                    <h2>Forecast vs. actual</h2>
                    <p className="panel-description">
                      Compare observed wind output with the latest forecast
                      available at the selected cutoff.
                    </p>
                  </div>
                  <div className="chart-units">MW · UK local time</div>
                </div>

                {chartData.length > 0 ? (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartData}
                        margin={{ top: 10, right: 12, bottom: 4, left: 2 }}
                      >
                        <defs>
                          <linearGradient
                            id="actualFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#0f9b83" stopOpacity={0.16} />
                            <stop offset="100%" stopColor="#0f9b83" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          vertical={false}
                          stroke="var(--chart-grid)"
                          strokeDasharray="3 5"
                        />
                        <XAxis
                          dataKey="time"
                          minTickGap={55}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "var(--chart-muted)", fontSize: 11 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={56}
                          tick={{ fill: "var(--chart-muted)", fontSize: 11 }}
                          tickFormatter={(value) => nf.format(value)}
                          label={{
                            value: "MW",
                            angle: -90,
                            position: "insideLeft",
                            fill: "var(--chart-muted)",
                            fontSize: 11,
                          }}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="plainline"
                          wrapperStyle={{
                            paddingBottom: 18,
                            fontSize: 12,
                            color: "var(--muted)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="actualGeneration"
                          name="Actual generation"
                          stroke="none"
                          fill="url(#actualFill)"
                          legendType="none"
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="actualGeneration"
                          name="Actual generation"
                          stroke="#0f9b83"
                          strokeWidth={2.2}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="forecastGeneration"
                          name="Forecast generation"
                          stroke="#4968df"
                          strokeWidth={2}
                          strokeDasharray="5 4"
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                          isAnimationActive={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-state-icon">⌁</span>
                    <h3>No matched data for this cutoff</h3>
                    <p>
                      Try another cutoff or verify the available forecast
                      publications and actual generation records.
                    </p>
                  </div>
                )}

                <div className="chart-footnote">
                  <span className="footnote-dot" />
                  <span>
                    Forecasts are selected using publication timestamps; later
                    forecasts are excluded from the evaluation.
                  </span>
                </div>
              </section>

              <section className="panel table-panel" id="intervals">
                <div className="panel-header table-panel-header">
                  <div>
                    <div className="panel-kicker">AUDITABLE RECORDS</div>
                    <h2>Delivery interval details</h2>
                    <p className="panel-description">
                      Inspect forecast selection and error for individual
                      delivery periods.
                    </p>
                  </div>
                  <span className="record-count">
                    {nf.format(analysis.data.length)} records
                  </span>
                </div>

                <div className="table-meta">
                  Showing the first {Math.min(100, analysis.data.length)} of{" "}
                  {analysis.data.length} matched intervals
                </div>

                <div className="table-wrapper" tabIndex={0}>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Delivery time (UK)</th>
                        <th scope="col">Forecast published (UTC)</th>
                        <th scope="col" className="num">Actual (MW)</th>
                        <th scope="col" className="num">Forecast (MW)</th>
                        <th scope="col" className="num">Error (MW)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.data.slice(0, 100).map((row) => (
                        <tr key={row.startTime}>
                          <td className="delivery-cell">
                            {new Date(row.startTime).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Europe/London",
                            })}
                          </td>
                          <td className="publish-cell">
                            {new Date(row.publishTime).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "UTC",
                            })}
                          </td>
                          <td className="num">
                            {formatNumber(row.actualGeneration)}
                          </td>
                          <td className="num">
                            {formatNumber(row.forecastGeneration)}
                          </td>
                          <td className="num">
                            {row.error == null ? (
                              <span className="error-neutral">N/A</span>
                            ) : (
                              <span
                                className={`error-pill ${
                                  row.error > 0
                                    ? "error-positive"
                                    : row.error < 0
                                      ? "error-negative"
                                      : "error-zero"
                                }`}
                              >
                                {formatSigned(row.error)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <span>
                    <span className="legend-dot positive" />
                    Positive error = over-forecast
                  </span>
                  <span>
                    <span className="legend-dot negative" />
                    Negative error = under-forecast
                  </span>
                </div>
              </section>

              <footer className="page-footer">
                <span>Windscope · Wind forecast quality</span>
                <span>Data source: Elexon BMRS</span>
                <span>Cutoff: {cutoff} Europe/London</span>
              </footer>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
