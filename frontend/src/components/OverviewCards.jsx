import React from "react";
import { Server, CheckCircle2, AlertOctagon, Flame, Clock, Zap, TrendingUp, ShieldCheck } from "lucide-react";

export default function OverviewCards({ overview }) {
  if (!overview) return null;

  const cards = [
    {
      label: "Fleet Scale",
      value: overview.total_chillers ?? 0,
      unit: "Units",
      subtext: "Monitored Equipment",
      icon: Server,
      gradient: "from-cyan-500/20 to-blue-500/5",
      iconColor: "text-cyan-500 dark:text-cyan-400",
      iconBg: "bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/20",
      borderHover: "hover:border-cyan-500/40",
      glow: "hover:shadow-[0_12px_30px_-6px_rgba(6,182,212,0.25)]"
    },
    {
      label: "Fleet Health",
      value: overview.normal_equipment_count ?? 0,
      unit: "Optimal",
      subtext: "Score >= 85% Nominal",
      icon: CheckCircle2,
      gradient: "from-emerald-500/20 to-teal-500/5",
      iconColor: "text-emerald-500 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20",
      borderHover: "hover:border-emerald-500/40",
      glow: "hover:shadow-[0_12px_30px_-6px_rgba(16,185,129,0.25)]"
    },
    {
      label: "Risk Queue",
      value: overview.attention_equipment_count ?? 0,
      unit: "Needs Review",
      subtext: "Elevated Thermodynamic Drift",
      icon: AlertOctagon,
      gradient: "from-amber-500/20 to-yellow-500/5",
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20",
      borderHover: "hover:border-amber-500/40",
      glow: "hover:shadow-[0_12px_30px_-6px_rgba(245,158,11,0.25)]"
    },
    {
      label: "High Severity",
      value: overview.high_severity_anomalies ?? 0,
      unit: "Persistent",
      subtext: "Multi-Cycle Control Breaches",
      icon: Flame,
      gradient: "from-rose-500/20 to-red-500/5",
      iconColor: "text-rose-500 dark:text-rose-400",
      iconBg: "bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20",
      borderHover: "hover:border-rose-500/40",
      glow: "hover:shadow-[0_12px_30px_-6px_rgba(244,63,94,0.25)]"
    },
    {
      label: "Anomalous Cycles",
      value: overview.total_anomalous_periods ?? 0,
      unit: "Events",
      subtext: `${((overview.total_anomalous_periods || 0) * 0.5).toFixed(1)} Operating Hours`,
      icon: Clock,
      gradient: "from-purple-500/20 to-indigo-500/5",
      iconColor: "text-purple-500 dark:text-purple-400",
      iconBg: "bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20",
      borderHover: "hover:border-purple-500/40",
      glow: "hover:shadow-[0_12px_30px_-6px_rgba(168,85,247,0.25)]"
    },
    {
      label: "Energy Footprint",
      value: `${((overview.total_energy_kwh || 0) / 1000).toFixed(1)}`,
      unit: "MWh",
      subtext: `${overview.total_records?.toLocaleString() || 0} Telemetry Cycles`,
      icon: Zap,
      gradient: "from-blue-500/20 to-cyan-500/5",
      iconColor: "text-blue-500 dark:text-cyan-400",
      iconBg: "bg-blue-500/10 dark:bg-cyan-500/20 border border-blue-500/20",
      borderHover: "hover:border-blue-500/40",
      glow: "hover:shadow-[0_12px_30px_-6px_rgba(59,130,246,0.25)]"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`card-clean p-4 relative overflow-hidden transition-all duration-300 ${card.borderHover} ${card.glow} group hover:-translate-y-1`}
          >
            {/* Ambient Background Gradient Accent */}
            <div
              className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${card.gradient} rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500`}
            ></div>

            {/* Header: Label & Glowing Icon */}
            <div className="flex items-center justify-between mb-2.5 relative z-10">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-heading">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl ${card.iconBg} shadow-xs group-hover:scale-110 transition-transform duration-200`}>
                <IconComponent className={`w-3.5 h-3.5 ${card.iconColor}`} />
              </div>
            </div>

            {/* Main Value */}
            <div className="relative z-10 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-heading">
                {card.value}
              </span>
              {card.unit && (
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  {card.unit}
                </span>
              )}
            </div>

            {/* Subtext info */}
            <div className="relative z-10 text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate font-medium">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
