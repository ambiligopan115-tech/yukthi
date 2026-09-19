import React, { useState } from "react";
import { AlertCircle, Search, ChevronRight, Zap, Download, Filter, Flame, Sparkles } from "lucide-react";
import { getAnomalyExportUrl } from "../api";

export default function AnomalyTable({
  anomalies,
  equipments,
  selectedEquipment,
  onFilterEquipment,
  selectedSeverity,
  onFilterSeverity,
  onSelectAnomaly
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const items = anomalies?.items || [];
  const total = anomalies?.total || 0;

  const filteredItems = items.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.timestamp.toLowerCase().includes(term) ||
      item.equipment_id.toLowerCase().includes(term) ||
      item.severity.toLowerCase().includes(term)
    );
  });

  return (
    <div className="card-clean p-5 sm:p-6 mb-8 relative overflow-hidden">
      {/* Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-500">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                  Detected Anomalies & Diagnostic Queue
                </h3>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 shadow-xs">
                  {total} Detections
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Multi-cycle thermodynamic deviations conditioned on outdoor weather and thermal cooling load.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search timestamp / unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/[0.08] rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-48 font-medium shadow-xs"
            />
          </div>

          {/* Chiller Filter */}
          <select
            value={selectedEquipment || "ALL"}
            onChange={(e) => onFilterEquipment(e.target.value)}
            className="bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">All Chillers</option>
            {equipments?.map((e) => (
              <option key={e.equipment_id} value={e.equipment_id}>
                {e.equipment_id}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity || "ALL"}
            onChange={(e) => onFilterSeverity(e.target.value)}
            className="bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium Severity</option>
            <option value="LOW">Low Severity</option>
          </select>

          {/* Export CSV Button */}
          {total > 0 && (
            <a
              href={getAnomalyExportUrl()}
              download="detected_anomalies.csv"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] transition-all cursor-pointer shadow-xs hover:scale-105"
              title="Export detected contextual anomalies as CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-500" />
              <span>Export CSV</span>
            </a>
          )}
        </div>
      </div>

      {/* Table with High-Tech Aesthetics */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/[0.05]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-extrabold bg-slate-100/70 dark:bg-slate-950/70 font-mono">
              <th className="py-3 px-3.5">Unit</th>
              <th className="py-3 px-3.5">Cycle Timestamp</th>
              <th className="py-3 px-3.5">Severity</th>
              <th className="py-3 px-3.5">Persistence</th>
              <th className="py-3 px-3.5">Actual Power</th>
              <th className="py-3 px-3.5">Expected Baseline</th>
              <th className="py-3 px-3.5">Thermal Load</th>
              <th className="py-3 px-3.5">CHW Loop</th>
              <th className="py-3 px-3.5">Ambient Temp</th>
              <th className="py-3 px-3.5 text-right">Anomaly Score</th>
              <th className="py-3 px-2 text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-slate-400 font-medium">
                  No anomalies matching current filter criteria.
                </td>
              </tr>
            ) : (
              filteredItems.map((anom) => {
                let sevStyle = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
                if (anom.severity === "MEDIUM") {
                  sevStyle = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
                } else if (anom.severity === "LOW") {
                  sevStyle = "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
                }

                let persistBadge = "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30";
                if (anom.persistence_type === "REPEATED") {
                  persistBadge = "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
                } else if (anom.persistence_type === "ISOLATED") {
                  persistBadge = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
                }

                const diffPct = anom.energy_expected
                  ? Math.round(((anom.energy_actual - anom.energy_expected) / anom.energy_expected) * 100)
                  : 0;

                return (
                  <tr
                    key={anom.id}
                    className="hover:bg-cyan-500/5 dark:hover:bg-cyan-950/20 transition-all cursor-pointer group"
                    onClick={() => onSelectAnomaly(anom.id)}
                  >
                    <td className="py-3 px-3.5 font-black text-slate-900 dark:text-white font-mono group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {anom.equipment_id}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-slate-300 font-medium">
                      {anom.timestamp}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${sevStyle}`}>
                        {anom.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${persistBadge}`}>
                        {anom.persistence_type} ({anom.persistence_count}x)
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {anom.energy_actual.toFixed(1)} kWh
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-500 dark:text-slate-400 font-medium">
                      {anom.energy_expected ? (
                        <span>
                          {anom.energy_expected.toFixed(1)} kWh{" "}
                          <span
                            className={`text-[10px] font-extrabold ${
                              diffPct > 0 ? "text-rose-500 dark:text-rose-400" : "text-emerald-500 dark:text-emerald-400"
                            }`}
                          >
                            ({diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`})
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300 font-medium">
                      {anom.building_load.toFixed(0)} RT
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300 font-medium">
                      {anom.chw_flow_actual.toFixed(1)} L/s
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300 font-medium">
                      {anom.outside_temp.toFixed(1)} °F
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-black text-cyan-600 dark:text-cyan-400 text-sm">
                      {anom.anomaly_score.toFixed(1)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAnomaly(anom.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-cyan-500/10 transition-all cursor-pointer group-hover:translate-x-0.5"
                        title="View diagnostic explainability"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
