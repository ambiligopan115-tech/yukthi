import React from "react";
import {
  X,
  Zap,
  Compass,
  FileText,
  Activity,
  Check,
  Flame,
  Clock,
  Sparkles,
  Thermometer,
  Droplets
} from "lucide-react";

export default function AnomalyModal({ anomalyDetail, onClose }) {
  if (!anomalyDetail) return null;

  const {
    equipment_id,
    timestamp,
    anomaly_score,
    severity,
    persistence_type,
    persistence_count,
    metrics,
    context,
    evidence,
    recommendations
  } = anomalyDetail;

  let sevBadge = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
  if (severity === "MEDIUM") {
    sevBadge = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
  } else if (severity === "LOW") {
    sevBadge = "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="card-clean max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Illuminated Hairline */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-rose-500 to-indigo-500"></div>

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                Diagnostic Telemetry
              </span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${sevBadge}`}>
                {severity} RISK
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                {persistence_type} ({persistence_count}x)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-heading flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-500" />
              <span>{equipment_id}</span>
              <span className="text-slate-400 font-light">&bull;</span>
              <span className="font-mono text-base sm:text-lg text-slate-600 dark:text-slate-300 font-semibold">{timestamp}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold font-mono">
                Anomaly Score
              </span>
              <span className="text-2xl font-black font-mono text-cyan-500">
                {anomaly_score?.toFixed(1)}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 text-xs">
          {/* Actual vs Expected Measurements */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2 font-heading">
              <Zap className="w-4 h-4 text-cyan-500" />
              Observed Telemetry vs. Contextual ML Expectation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Energy Card */}
              {metrics?.energy_consumption && (
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/[0.08]">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-heading">
                      Chiller Power (kWh)
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        metrics.energy_consumption.diff_pct > 12
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {metrics.energy_consumption.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-2.5 border-t border-b border-slate-200/80 dark:border-white/[0.06] my-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono font-semibold">Observed Actual</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        {metrics.energy_consumption.actual} kWh
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono font-semibold">Expected ML Baseline</span>
                      <span className="text-xl font-black text-cyan-500 font-mono">
                        {metrics.energy_consumption.expected} kWh
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-mono">
                    <span>
                      Confidence Range: {metrics.energy_consumption.normal_range[0]} -{" "}
                      {metrics.energy_consumption.normal_range[1]} kWh
                    </span>
                    <span
                      className={`font-black ${
                        metrics.energy_consumption.diff_pct > 0 ? "text-rose-500 dark:text-rose-400" : "text-emerald-500 dark:text-emerald-400"
                      }`}
                    >
                      {metrics.energy_consumption.diff_pct > 0
                        ? `+${metrics.energy_consumption.diff_pct}%`
                        : `${metrics.energy_consumption.diff_pct}%`}
                    </span>
                  </div>
                </div>
              )}

              {/* Chilled Water Flow Card */}
              {metrics?.chilled_water_rate && (
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/[0.08]">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-heading">
                      CHW Evaporator Flow
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        Math.abs(metrics.chilled_water_rate.diff_pct) > 12
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {metrics.chilled_water_rate.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-2.5 border-t border-b border-slate-200/80 dark:border-white/[0.06] my-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono font-semibold">Observed Actual</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        {metrics.chilled_water_rate.actual} L/s
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono font-semibold">Expected ML Baseline</span>
                      <span className="text-xl font-black text-cyan-500 font-mono">
                        {metrics.chilled_water_rate.expected} L/s
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-mono">
                    <span>
                      Confidence Range: {metrics.chilled_water_rate.normal_range[0]} -{" "}
                      {metrics.chilled_water_rate.normal_range[1]} L/s
                    </span>
                    <span
                      className={`font-black ${
                        metrics.chilled_water_rate.diff_pct > 0 ? "text-amber-500 dark:text-amber-400" : "text-cyan-500"
                      }`}
                    >
                      {metrics.chilled_water_rate.diff_pct > 0
                        ? `+${metrics.chilled_water_rate.diff_pct}%`
                        : `${metrics.chilled_water_rate.diff_pct}%`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Environmental Context */}
          {context && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-2 font-heading">
                <Compass className="w-4 h-4 text-indigo-500" />
                Ambient & Thermal Load Context
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06]">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Building Load</span>
                  <span className="font-extrabold text-slate-900 dark:text-white font-mono text-base">{context.building_load_rt} RT</span>
                  <span className="text-[10px] text-slate-400 block font-medium">({context.load_status})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Outdoor Temp</span>
                  <span className="font-extrabold text-slate-900 dark:text-white font-mono text-base">{context.outside_temp_f} °F</span>
                  <span className="text-[10px] text-slate-400 block font-medium">({context.ambient_status})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Humidity / Dew</span>
                  <span className="font-extrabold text-slate-900 dark:text-white font-mono text-base">
                    {context.humidity_pct}% / {context.dew_point_f}°F
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Cooling Water</span>
                  <span className="font-extrabold text-slate-900 dark:text-white font-mono text-base">{context.cooling_water_temp_c} °C</span>
                </div>
              </div>
            </div>
          )}

          {/* Machine Learning Evidence */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-2 font-heading">
              <FileText className="w-4 h-4 text-amber-500" />
              Explainable AI (XAI) Evidence Indicators
            </h3>
            <div className="bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-4 space-y-2.5">
              {evidence?.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1 shrink-0 shadow-xs" />
                  <p className="leading-relaxed font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-2 font-heading">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Targeted Engineering Action Recommendations
            </h3>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-2.5">
              {recommendations?.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 text-emerald-900 dark:text-emerald-200">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-semibold">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer hover:scale-105"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
