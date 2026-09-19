import React from "react";
import {
  Activity,
  UploadCloud,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sun,
  Moon,
  LayoutDashboard,
  LineChart,
  Radio
} from "lucide-react";

export default function Navbar({
  overview,
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onOpenUpload,
  onResetDataset
}) {
  const isLoaded = overview?.is_loaded && (overview?.total_records || 0) > 0;
  const sourceLabel = overview?.dataset_source || "No Dataset Loaded";

  const navTabs = [
    { id: "dashboard", label: "Fleet Dashboard", icon: LayoutDashboard },
    { id: "timeseries", label: "Time-Series Explorer", icon: LineChart },
    { id: "anomalies", label: "Anomaly Diagnostics", icon: AlertCircle },
    { id: "ml-insights", label: "ML Methodology", icon: Cpu }
  ];

  return (
    <header className="sticky top-2 z-50 px-3 sm:px-6 pt-2 pb-1">
      <div className="max-w-7xl mx-auto backdrop-blur-2xl bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-white/[0.09] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] px-4 sm:px-5 py-2.5 transition-all duration-300">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 text-white">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight font-heading">
                    <span className="text-gradient-cyan">CHILLER AI</span>
                  </span>
                  <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 shadow-xs">
                    v1.1 • PROD
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <Radio className="w-3 h-3 text-emerald-500" />
                  <span className="font-mono text-[10px] uppercase tracking-wide">Contextual ML Engine Online</span>
                </div>
              </div>
            </div>

            {/* Theme Toggle on mobile */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

          {/* Tab Navigation Controls */}
          <nav className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-950/60 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 w-full md:w-auto overflow-x-auto shadow-inner">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-slate-800/90 text-cyan-600 dark:text-cyan-400 shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_16px_rgba(6,182,212,0.2)] border border-slate-200/80 dark:border-cyan-500/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-500 dark:text-cyan-400" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & Theme Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Active dataset indicator */}
            {isLoaded ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium backdrop-blur-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="hidden lg:inline truncate max-w-[140px] font-semibold">{sourceLabel}</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    ({overview?.total_records} pts)
                  </span>
                </div>
                <button
                  onClick={onResetDataset}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 dark:bg-slate-800/80 dark:hover:bg-rose-950/40 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-xs hover:scale-105"
                  title="Reset / Unload Dataset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Ready for Telemetry</span>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-md shadow-cyan-500/25 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Upload operational CSV dataset"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload CSV</span>
            </button>

            {/* Desktop Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="hidden md:flex items-center justify-center p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-xs hover:rotate-12"
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
