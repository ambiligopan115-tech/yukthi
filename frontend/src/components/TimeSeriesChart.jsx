import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Brush
} from "recharts";
import { LineChart as LineChartIcon, Zap, Activity, Thermometer, Droplets, CheckCircle2, ChevronRight, Sliders } from "lucide-react";

export default function TimeSeriesChart({
  timeseries,
  selectedEquipment,
  equipments,
  onSelectEquipment,
  onSelectAnomaly,
  isDark
}) {
  const [activeMetric, setActiveMetric] = useState("energy"); // energy | flow | load | temps | humidity
  const [showExpectedBand, setShowExpectedBand] = useState(true);

  // Format data for Recharts
  const chartData = useMemo(() => {
    if (!timeseries) return [];
    return timeseries.map((pt) => ({
      ...pt,
      fullTimestamp: pt.timestamp,
    }));
  }, [timeseries]);

  const anomalyCount = useMemo(() => {
    return chartData.filter((p) => p.is_anomaly).length;
  }, [chartData]);

  // Custom dot for anomalies with defensive NaN / coordinate checks
  const renderCustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload || !payload.is_anomaly || cx == null || cy == null || isNaN(cx) || isNaN(cy)) return null;

    let fillColor = "#f43f5e"; // HIGH - rose neon
    if (payload.severity === "MEDIUM") fillColor = "#f59e0b"; // amber neon
    if (payload.severity === "LOW") fillColor = "#eab308"; // yellow neon

    return (
      <circle
        key={`dot-${payload.id || payload.timestamp}`}
        cx={cx}
        cy={cy}
        r={5}
        fill={fillColor}
        stroke="#ffffff"
        strokeWidth={1.5}
        className="cursor-pointer hover:r-7 transition-all animate-pulse shadow-lg"
        onClick={() => onSelectAnomaly && onSelectAnomaly(payload.id)}
      />
    );
  };

  const formatTimestamp = (t) => {
    if (!t) return "";
    const parts = t.split(" ");
    if (parts.length >= 2) {
      return `${parts[0].slice(5)} ${parts[1].slice(0, 5)}`;
    }
    return t.slice(5);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const pt = payload[0].payload;

    return (
      <div className="bg-white/90 dark:bg-slate-950/90 border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl text-xs z-50 min-w-[280px]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{pt.fullTimestamp}</span>
          {pt.is_anomaly ? (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border tracking-wide shadow-sm ${
                pt.severity === "HIGH"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  : pt.severity === "MEDIUM"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
              }`}
            >
              {pt.severity} ANOMALY
            </span>
          ) : (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Nominal
            </span>
          )}
        </div>

        <div className="space-y-2 text-slate-600 dark:text-slate-300">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
              Chiller Power:
            </span>
            <span className="font-mono text-slate-900 dark:text-white font-bold">
              {pt.energy?.toFixed(1)} kWh
              {pt.expected_energy && (
                <span className="text-[11px] text-cyan-500/80 font-normal ml-1.5">
                  (Exp: {pt.expected_energy.toFixed(1)})
                </span>
              )}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              Thermal Load:
            </span>
            <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">
              {pt.building_load?.toFixed(0)} RT
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-emerald-500" />
              CHW Flow:
            </span>
            <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">
              {pt.chw_rate?.toFixed(1)} L/s
              {pt.expected_chw_rate && (
                <span className="text-[11px] text-emerald-500/80 font-normal ml-1.5">
                  (Exp: {pt.expected_chw_rate.toFixed(1)})
                </span>
              )}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              Ambient Dry-Bulb:
            </span>
            <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">
              {pt.outside_temp?.toFixed(1)} °F
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Condenser Water:</span>
            <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">
              {pt.cooling_water_temp?.toFixed(1)} °C
            </span>
          </div>
        </div>

        {pt.is_anomaly && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-cyan-600 dark:text-cyan-400 text-[11px] font-bold cursor-pointer hover:opacity-80">
            <span>Score: {pt.anomaly_score?.toFixed(1)}</span>
            <span className="underline">View Diagnostic Evidence &rarr;</span>
          </div>
        )}
      </div>
    );
  };

  const axisColor = isDark ? "#475569" : "#cbd5e1";
  const tickColor = isDark ? "#94a3b8" : "#475569";

  return (
    <div className="card-clean p-5 sm:p-6 mb-6 relative overflow-hidden">
      {/* Header with Chiller Selector & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-500">
              <LineChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                Operational Telemetry Explorer
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Dual-engine contextual expected baselines vs observed signals
              </p>
            </div>
          </div>

          {/* Direct Chiller Selector */}
          {equipments && (
            <div className="flex items-center gap-2 ml-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Focus:</span>
              <select
                value={selectedEquipment}
                onChange={(e) => onSelectEquipment(e.target.value)}
                className="bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer shadow-xs"
              >
                {equipments.map((eq) => (
                  <option key={eq.equipment_id} value={eq.equipment_id}>
                    {eq.equipment_id} ({eq.health_score}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {anomalyCount > 0 && (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              {anomalyCount} Anomalies Plotted
            </span>
          )}
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100/90 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-inner">
          {[
            { id: "energy", label: "Energy (kWh)", icon: Zap },
            { id: "flow", label: "CHW Flow (L/s)", icon: Droplets },
            { id: "load", label: "Load (RT)", icon: Activity },
            { id: "temps", label: "Temperatures", icon: Thermometer },
            { id: "humidity", label: "Weather", icon: Droplets }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                activeMetric === m.id
                  ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-md border border-slate-200 dark:border-cyan-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <m.icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">High Risk Event</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Medium Deviation</span>
          </span>
          {activeMetric === "energy" && (
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
              <input
                type="checkbox"
                checked={showExpectedBand}
                onChange={(e) => setShowExpectedBand(e.target.checked)}
                className="rounded-md border-slate-300 text-cyan-600 focus:ring-0 cursor-pointer"
              />
              Show Expected Contextual Band (±2.5σ)
            </label>
          )}
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Click any anomaly dot to view deep contextual explainability
        </span>
      </div>

      {/* Chart Canvas */}
      {chartData.length === 0 ? (
        <div className="w-full h-[420px] flex flex-col items-center justify-center gap-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-500">
            <LineChartIcon className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-heading">
            No Telemetry Points Available for {selectedEquipment || "Selected Chiller"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Please select an active equipment unit from the fleet dropdown above or upload telemetry data to begin time-series exploration.
          </p>
        </div>
      ) : (
        <div
          className="w-full h-[440px] min-h-[440px] relative"
          style={{ width: "100%", height: "440px", minHeight: "440px" }}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={400}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? "#06b6d4" : "#0284c7"} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={isDark ? "#06b6d4" : "#0284c7"} stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                stroke={axisColor}
                tick={{ fill: tickColor, fontSize: 10, fontFamily: "JetBrains Mono" }}
                minTickGap={40}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke={axisColor}
                tick={{ fill: tickColor, fontSize: 10, fontFamily: "JetBrains Mono" }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Active Metric: Energy */}
              {activeMetric === "energy" && (
                <>
                  {showExpectedBand && (
                    <>
                      <Area
                        type="monotone"
                        dataKey="expected_energy_upper"
                        stroke="none"
                        fill="url(#bandGrad)"
                        name="Expected Range Upper"
                      />
                      <Line
                        type="monotone"
                        dataKey="expected_energy"
                        stroke="#3b82f6"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        dot={false}
                        name="Expected Baseline"
                      />
                    </>
                  )}
                  <Area
                    type="monotone"
                    dataKey="energy"
                    stroke={isDark ? "#06b6d4" : "#0284c7"}
                    strokeWidth={2.5}
                    fill="url(#energyGrad)"
                    name="Actual Energy"
                    dot={renderCustomDot}
                  />
                </>
              )}

              {/* Active Metric: Flow */}
              {activeMetric === "flow" && (
                <>
                  <Line
                    type="monotone"
                    dataKey="expected_chw_rate"
                    stroke="#3b82f6"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name="Expected CHW Flow"
                  />
                  <Line
                    type="monotone"
                    dataKey="chw_rate"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    name="Actual CHW Flow (L/s)"
                    dot={renderCustomDot}
                  />
                </>
              )}

              {/* Active Metric: Building Load */}
              {activeMetric === "load" && (
                <Area
                  type="monotone"
                  dataKey="building_load"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                  name="Building Load (RT)"
                  dot={renderCustomDot}
                />
              )}

              {/* Active Metric: Temperatures */}
              {activeMetric === "temps" && (
                <>
                  <Line
                    type="monotone"
                    dataKey="outside_temp"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    name="Outside Temp (°F)"
                  />
                  <Line
                    type="monotone"
                    dataKey="cooling_water_temp"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    name="Cooling Water Temp (°C)"
                  />
                </>
              )}

              {/* Active Metric: Humidity */}
              {activeMetric === "humidity" && (
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                  name="Humidity (%)"
                />
              )}

              {chartData.length > 5 && (
                <Brush
                  dataKey="timestamp"
                  height={26}
                  stroke={isDark ? "#06b6d4" : "#0284c7"}
                  fill={isDark ? "#0b0f19" : "#f8fafc"}
                  tickFormatter={formatTimestamp}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
