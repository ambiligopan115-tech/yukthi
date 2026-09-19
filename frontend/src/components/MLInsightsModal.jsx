import React from "react";
import { X, Cpu, Layers, Binary, ShieldAlert, Sparkles, Activity, CheckCircle2 } from "lucide-react";

export default function MLInsightsModal({ mlInsights, onClose, isModal = true }) {
  if (!mlInsights) return null;

  const content = (
    <div className="space-y-6 text-xs">
      {/* Summary Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.06]">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Model Family</span>
          <span className="font-extrabold text-slate-900 dark:text-white text-sm font-heading">Dual-Engine Contextual</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Observations</span>
          <span className="font-extrabold text-cyan-500 font-mono text-sm">
            {mlInsights.total_observations_analyzed?.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Anomalies Detected</span>
          <span className="font-extrabold text-rose-500 font-mono text-sm">
            {mlInsights.total_anomalies_detected?.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">Contamination Rate</span>
          <span className="font-extrabold text-amber-500 font-mono text-sm">
            {(mlInsights.contamination_rate * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Why Static Thresholds Fail */}
      <div className="bg-cyan-500/10 border border-cyan-500/25 rounded-2xl p-4.5">
        <h4 className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider mb-1.5 flex items-center gap-2 font-heading">
          <ShieldAlert className="w-4 h-4 text-cyan-500" />
          Why Static Thresholds Fail vs. Contextual ML
        </h4>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs font-medium">
          {mlInsights.why_contextual}
        </p>
      </div>

      {/* Architecture Breakdown */}
      <div>
        <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2 font-heading">
          <Layers className="w-4 h-4 text-purple-500" />
          Multi-Engine Contextual AI Architecture
        </h4>
        <div className="space-y-3">
          <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl">
            <span className="font-bold text-slate-900 dark:text-white block mb-1 font-heading text-xs">
              1. Expected-vs-Observed Baseline Regressors (Random Forest)
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Learns conditional expectation functions E[Energy | Building Load, Weather, Time] and E[CHW Flow | Load] per equipment. Computes residuals z = |y - ŷ| / σ. This gives exact baseline predictions and ±2.5σ normal bands.
            </p>
          </div>
          <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl">
            <span className="font-bold text-slate-900 dark:text-white block mb-1 font-heading text-xs">
              2. Multivariate Isolation Forest Outlier Detector
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Trained on normalized contextual features, thermodynamic ratios (kW/RT, Flow/RT, Cooling Delta), and regressor residuals to capture multi-dimensional non-linear interactions across sensors.
            </p>
          </div>
          <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/[0.06] rounded-2xl">
            <span className="font-bold text-slate-900 dark:text-white block mb-1 font-heading text-xs">
              3. Multi-Cycle Persistence & Health Indicator Engine
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Differentiates isolated single sensor spikes from persistent multi-hour operational anomalies (≥3 timestamps). Dynamically computes a fleet health index (0–100%) based on severity weightings and recent degradation.
            </p>
          </div>
        </div>
      </div>

      {/* Contextual Features */}
      <div>
        <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2 font-heading">
          <Binary className="w-4 h-4 text-emerald-500" />
          Contextual Features & Thermodynamic Derived Signals
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {mlInsights.context_features_used?.map((feat, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-mono text-[11px] font-medium shadow-2xs"
            >
              {feat}
            </span>
          ))}
          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 font-mono text-[11px] font-semibold">
            specific_power_kw_rt
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 font-mono text-[11px] font-semibold">
            cooling_temp_diff_c
          </span>
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return (
      <div className="card-clean p-6 sm:p-7 mb-8 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-500">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
              Machine Learning Methodology & Contextual Architecture
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Technical Overview & Dual-Engine Thermodynamic Specification
            </span>
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="card-clean max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-500">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                Machine Learning Methodology
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Dual-Engine Regressor & Isolation Forest Specification
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">{content}</div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer hover:scale-105"
          >
            Close Insights
          </button>
        </div>
      </div>
    </div>
  );
}
