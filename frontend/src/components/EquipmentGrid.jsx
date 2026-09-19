import React from "react";
import { Gauge, Clock, Zap, CheckCircle2, ChevronRight, Activity, Thermometer, Wind, Radio } from "lucide-react";

export default function EquipmentGrid({
  equipments,
  selectedEquipment,
  onSelectEquipment,
  onViewTimeseries
}) {
  if (!equipments || equipments.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-heading">
            <Gauge className="w-4 h-4 text-cyan-500" />
            Equipment Fleet & Operational Health
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Active unit focus determines telemetry series visualization and targeted diagnostic insights.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs font-semibold">
            {equipments.length} {equipments.length === 1 ? "Chiller Monitored" : "Chillers in Fleet"}
          </span>
        </div>
      </div>

      {/* Grid of Chillers */}
      <div className={`grid gap-4 ${equipments.length === 1 ? "grid-cols-1 max-w-xl" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
        {equipments.map((chiller) => {
          const isSelected = selectedEquipment === chiller.equipment_id;
          const health = chiller.health_score;

          // Health scheme
          let healthColor = "text-emerald-500 dark:text-emerald-400";
          let healthBg = "bg-emerald-500/10 dark:bg-emerald-500/20";
          let healthBorder = "border-emerald-500/30";
          let barGradient = "from-emerald-500 to-teal-400";

          if (health < 60) {
            healthColor = "text-rose-500 dark:text-rose-400";
            healthBg = "bg-rose-500/10 dark:bg-rose-500/20";
            healthBorder = "border-rose-500/30";
            barGradient = "from-rose-500 to-red-400";
          } else if (health < 80) {
            healthColor = "text-amber-500 dark:text-amber-400";
            healthBg = "bg-amber-500/10 dark:bg-amber-500/20";
            healthBorder = "border-amber-500/30";
            barGradient = "from-amber-500 to-yellow-400";
          }

          // Severity tag
          let sevTag = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
          if (chiller.current_severity === "HIGH") {
            sevTag = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse";
          } else if (chiller.current_severity === "MEDIUM") {
            sevTag = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
          } else if (chiller.current_severity === "LOW") {
            sevTag = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
          } else {
            sevTag = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
          }

          return (
            <div
              key={chiller.equipment_id}
              onClick={() => onSelectEquipment(chiller.equipment_id)}
              className={`card-clean p-5 relative overflow-hidden cursor-pointer transition-all duration-300 group ${
                isSelected
                  ? "ring-2 ring-cyan-500/80 border-cyan-500/60 shadow-[0_12px_36px_-6px_rgba(6,182,212,0.3)] bg-gradient-to-b from-cyan-500/5 via-white/80 to-white/95 dark:from-cyan-950/40 dark:via-slate-900/80 dark:to-slate-900/90"
                  : "hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_12px_28px_-6px_rgba(6,182,212,0.15)]"
              }`}
            >
              {/* Active illuminated top hairline */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>
              )}

              {/* Header: Unit ID, Severity & Health Pill */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                      {chiller.equipment_id}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${sevTag}`}>
                      {chiller.current_severity}
                    </span>
                    {isSelected && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
                    {chiller.status_label}
                  </span>
                </div>

                {/* Health Score Badge */}
                <div className={`px-3 py-1.5 rounded-xl border ${healthBorder} ${healthBg} text-right backdrop-blur-xs`}>
                  <div className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider font-mono">
                    Health
                  </div>
                  <div className={`text-xl font-black font-heading ${healthColor}`}>
                    {chiller.health_score}%
                  </div>
                </div>
              </div>

              {/* Animated Health Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-2 mb-4 overflow-hidden shadow-inner">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700`}
                  style={{ width: `${chiller.health_score}%` }}
                />
              </div>

              {/* Operational Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50/80 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-white/[0.05] mb-4 text-center">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-mono tracking-wider">
                    Anomalies
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm font-heading">
                    {chiller.anomaly_count}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-mono tracking-wider">
                    High Risk
                  </span>
                  <span className="font-extrabold text-rose-500 dark:text-rose-400 text-sm font-heading">
                    {chiller.high_severity_count}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-mono tracking-wider">
                    Persistent
                  </span>
                  <span className="font-extrabold text-purple-500 dark:text-purple-400 text-sm font-heading">
                    {chiller.persistent_count}
                  </span>
                </div>
              </div>

              {/* Latest Telemetry Snapshot */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono py-1 border-t border-slate-100 dark:border-slate-800/80 mb-2">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-500" />
                  <span>{chiller.latest_energy?.toFixed(1) || 0} kWh</span>
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-500" />
                  <span>{chiller.latest_load?.toFixed(0) || 0} RT</span>
                </span>
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-500" />
                  <span>{chiller.latest_outside_temp?.toFixed(1) || 0}°F</span>
                </span>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1.5 truncate max-w-[200px] text-[11px]">
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{chiller.last_anomaly_timestamp}</span>
                </span>
                {onViewTimeseries && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEquipment(chiller.equipment_id);
                      onViewTimeseries();
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform cursor-pointer"
                  >
                    <span>Analyze</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
