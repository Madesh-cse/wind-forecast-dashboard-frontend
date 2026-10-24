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

const nf = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });

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
      <p className="chart-tooltip-title">{label}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey} className="chart-tooltip-row">
          <span className="swatch" style={{ background: item.color }} />
          {item.name}
          <strong>{formatNumber(item.value)}</strong>
        </p>
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

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;

    async function loadAnalysis() {
      setLoading(true);
      setError("");
      try {
        const response = await api.get<WindAnalysis>("/api/wind/analysis", {
          params: { cutoff },
        });
        if (active) setAnalysis(response.data);
      } catch {
        if (active) {
          setError(
            "Wind analysis could not be loaded. Check that the backend is running and the Elexon API is reachable.",
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
    analysis && analysis.bias !== null
      ? analysis.bias > 0
        ? "Over-forecasting"
        : analysis.bias < 0
          ? "Under-forecasting"
          : "Balanced"
      : "";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">Procurement Intelligence</span>
        </div>
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <span>Forecast quality</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">UK wind generation</span>
        </nav>
      </header>

      <main className="dashboard">
        <section className="page-head">
          <div>
            <h1>Wind forecast accuracy</h1>
            <p className="page-sub">
              National UK wind generation, January 2026. Compares the latest
              forecast published before the cutoff with actual output.
            </p>
          </div>

          <div className="toolbar">
            <label className="field">
              <span>Day-ahead cutoff (Europe/London)</span>
              <input
                type="time"
                value={cutoff}
                onChange={(event) => setCutoff(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn"
              onClick={retry}
              disabled={loading}
            >
              {loading ? "Refreshing" : "Refresh data"}
            </button>
          </div>
        </section>

        <p className="notice" role="note">
          The {cutoff} cutoff is an illustrative assumption. It is configurable
          and is not a verified market deadline.
        </p>

        {error && (
          <div className="alert" role="alert">
            <div>
              <strong>Analysis unavailable</strong>
              <p>{error}</p>
            </div>
            <button type="button" className="btn" onClick={retry}>
              Try again
            </button>
          </div>
        )}

        {loading && !analysis && (
          <div className="skeleton-grid" aria-busy="true" aria-label="Loading">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" />
            ))}
            <div className="skeleton skeleton-wide" />
          </div>
        )}

        {analysis && (
          <div className={loading ? "content is-stale" : "content"}>
            <section className="kpi-strip" aria-label="Accuracy metrics">
              <article className="kpi">
                <h2>Mean absolute error</h2>
                <p className="kpi-value">{formatNumber(analysis.mae)}</p>
                <p className="kpi-note">Average miss, in source units</p>
              </article>
              <article className="kpi">
                <h2>Root mean squared error</h2>
                <p className="kpi-value">{formatNumber(analysis.rmse)}</p>
                <p className="kpi-note">Weights large misses more heavily</p>
              </article>
              <article className="kpi">
                <h2>Forecast bias</h2>
                <p className="kpi-value">{formatSigned(analysis.bias)}</p>
                <p className="kpi-note">
                  {biasDirection}. Positive means forecast above actual
                </p>
              </article>
              <article className="kpi">
                <h2>Matched intervals</h2>
                <p className="kpi-value">{analysis.matchedCount}</p>
                <p className="kpi-note">
                  {analysis.missingForecastCount} had no eligible forecast
                </p>
              </article>
            </section>

            {chartData.length > 0 ? (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Forecast vs actual generation</h2>
                    <p className="panel-description">
                      Matched delivery intervals. The shaded band shows the gap
                      between forecast and actual.
                    </p>
                  </div>
                </div>

                <div className="chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f8b7a" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#0f8b7a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#e4e8ee" />
                      <XAxis
                        dataKey="time"
                        minTickGap={48}
                        tickLine={false}
                        axisLine={{ stroke: "#cfd6e0" }}
                        tick={{ fill: "#5b6778", fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={48}
                        tick={{ fill: "#5b6778", fontSize: 12 }}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="plainline"
                        wrapperStyle={{ paddingBottom: 12, fontSize: 13 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="actualGeneration"
                        name="Actual"
                        stroke="none"
                        fill="url(#actualFill)"
                        legendType="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="actualGeneration"
                        name="Actual"
                        stroke="#0f8b7a"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecastGeneration"
                        name="Forecast"
                        stroke="#3b5bdb"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>
            ) : (
              <section className="panel empty">
                <h2>No matched data for this cutoff</h2>
                <p>
                  Try a later cutoff time. If the problem continues, check the
                  Elexon API responses and date filters before relying on these
                  metrics.
                </p>
              </section>
            )}

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Delivery interval details</h2>
                  <p className="panel-description">
                    Showing up to 100 of {analysis.data.length} matched
                    intervals. Values keep the units of the source dataset.
                  </p>
                </div>
              </div>

              <div className="table-wrapper" tabIndex={0}>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Delivery time (UK)</th>
                      <th scope="col">Forecast published (UTC)</th>
                      <th scope="col" className="num">Actual</th>
                      <th scope="col" className="num">Forecast</th>
                      <th scope="col" className="num">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.data.slice(0, 100).map((row) => (
                      <tr key={row.startTime}>
                        <td>
                          {new Date(row.startTime).toLocaleString("en-GB", {
                            timeZone: "Europe/London",
                          })}
                        </td>
                        <td>
                          {new Date(row.publishTime).toLocaleString("en-GB", {
                            timeZone: "UTC",
                          })}
                        </td>
                        <td className="num">{formatNumber(row.actualGeneration)}</td>
                        <td className="num">{formatNumber(row.forecastGeneration)}</td>
                        <td
                          className={
                            "num " +
                            (row.error === null
                              ? ""
                              : row.error > 0
                                ? "err-over"
                                : row.error < 0
                                  ? "err-under"
                                  : "")
                          }
                        >
                          {formatSigned(row.error)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;