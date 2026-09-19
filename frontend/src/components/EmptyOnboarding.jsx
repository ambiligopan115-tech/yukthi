import React, { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  Activity
} from "lucide-react";
import { uploadDataset, getTemplateDownloadUrl } from "../api";

export default function EmptyOnboarding({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const processFile = async (selected) => {
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files (.csv) are supported.");
      return;
    }
    setFile(selected);
    setError(null);
    setFileAnalysis({ analyzing: true });

    try {
      const text = await selected.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 1) {
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
        const eqIdx = headers.findIndex((h) =>
          h === "equipment_id" || h === "equipment" || h === "chiller_id" || h === "chiller" || h === "unit"
        );

        let equipmentsFound = {};
        if (eqIdx !== -1) {
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",");
            if (cols.length > eqIdx) {
              const eq = cols[eqIdx].trim().replace(/^["']|["']$/g, "").toUpperCase();
              if (eq) {
                equipmentsFound[eq] = (equipmentsFound[eq] || 0) + 1;
              }
            }
          }
        }

        const units = Object.keys(equipmentsFound);
        setFileAnalysis({
          analyzing: false,
          totalRows: lines.length - 1,
          hasEquipmentColumn: eqIdx !== -1,
          equipments: equipmentsFound,
          unitCount: units.length,
          units: units
        });
      } else {
        setFileAnalysis({ analyzing: false, totalRows: 0, unitCount: 0 });
      }
    } catch (err) {
      console.warn("CSV pre-analysis:", err);
      setFileAnalysis(null);
    }
  };

  const handleRunPipeline = async () => {
    if (!file) {
      setError("Please select or drop a CSV file first.");
      return;
    }
    try {
      setUploading(true);
      setError(null);
      const res = await uploadDataset(file);
      onUploadSuccess(res);
    } catch (err) {
      setError(err.message || "Failed to parse and model operational dataset.");
    } finally {
      setUploading(false);
    }
  };

  const schemaColumns = [
    { name: "timestamp", unit: "YYYY-MM-DD HH:MM:SS", desc: "Operational cycle timestamp" },
    { name: "equipment_id", unit: "e.g. CHILLER-01", desc: "Chiller unit identifier" },
    { name: "Chilled Water Rate", unit: "L/sec", desc: "Evaporator circulation flow" },
    { name: "Cooling Water Temperature", unit: "°C", desc: "Condenser loop temperature" },
    { name: "Building Load", unit: "RT", desc: "Thermal tonnage requirement" },
    { name: "Chiller Energy Consumption", unit: "kWh", desc: "Compressor power consumption" },
    { name: "Outside Temperature", unit: "°F", desc: "Ambient outdoor dry-bulb" },
    { name: "Dew Point", unit: "°F", desc: "Ambient moisture saturation" },
    { name: "Humidity", unit: "%", desc: "Relative humidity percentage" },
    { name: "Wind Speed", unit: "mph", desc: "Cooling tower drift factor" },
    { name: "Pressure", unit: "inHg", desc: "Atmospheric barometric pressure" }
  ];

  return (
    <div className="py-4 space-y-8 animate-in fade-in duration-500">
      
      {/* Hero Welcome Banner with Atmospheric Glow */}
      <div className="rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-slate-900 via-[#0a0f1d] to-[#040814] border border-cyan-500/20 text-white shadow-[0_12px_48px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mb-20"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="tracking-wide">AI-DRIVEN INDUSTRIAL CHILLER TELEMETRY</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-heading mb-3 leading-tight">
            Ingest Facility Telemetry &{" "}
            <span className="text-gradient-cyan">Fit Contextual ML</span>
          </h1>
          
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
            Equip your HVAC facility with continuous expected-vs-observed machine learning. Upload your operational CSV to train dynamic thermodynamic baselines tailored strictly to each chiller unit.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={getTemplateDownloadUrl()}
              download="chiller_telemetry_template.csv"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 text-xs font-bold border border-slate-700/80 shadow-md transition-all hover:scale-105"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download Schema CSV Template</span>
            </a>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zero Hardcoded Thresholds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Drag & Drop Ingestion Box */}
        <div className="lg:col-span-7 card-clean p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-heading">
                <UploadCloud className="w-4 h-4 text-cyan-500" />
                Ingest Operational Dataset
              </h2>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Max 100MB • CSV
              </span>
            </div>

            {/* Drop Zone with Cyber High-Tech Styling */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all duration-300 cursor-pointer select-none overflow-hidden group ${
                dragActive
                  ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                  : "border-slate-300 dark:border-slate-700/80 hover:border-cyan-400 dark:hover:border-cyan-500/80 bg-slate-50/50 dark:bg-slate-950/40 hover:shadow-[0_8px_30px_rgba(6,182,212,0.12)]"
              }`}
            >
              {/* Full-coverage Native File Input */}
              <input
                id="onboarding-file-upload"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDrop={() => setDragActive(false)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Click to browse or drop CSV telemetry here"
              />

              <div className="pointer-events-none flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <FileSpreadsheet className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />
                </div>
                
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 font-heading">
                  Drop your chiller telemetry CSV here
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-sm">
                  Supports single-chiller or multi-chiller fleets. Automatically detects present chiller units.
                </p>

                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-all">
                  <UploadCloud className="w-4 h-4" />
                  <span>Browse From Computer</span>
                </div>
              </div>
            </div>

            {/* Selected File Details */}
            {file && (
              <>
                <div className="mt-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between backdrop-blur-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500 text-white shadow-sm">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate max-w-xs font-mono">
                        {file.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {(file.size / 1024).toFixed(1)} KB • Ready for Ingestion
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setFileAnalysis(null);
                    }}
                    className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline cursor-pointer font-bold px-2 py-1"
                  >
                    Change File
                  </button>
                </div>

                {/* Automated CSV Structure Analysis Preview */}
                {fileAnalysis && !fileAnalysis.analyzing && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200 dark:border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2 font-heading">
                        <Cpu className="w-4 h-4 text-cyan-500" />
                        Automated CSV Structure Discovery
                      </span>
                      <span
                        className={`text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${
                          fileAnalysis.unitCount === 1
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30"
                        }`}
                      >
                        {fileAnalysis.unitCount === 1
                          ? "Single Chiller Detected"
                          : `${fileAnalysis.unitCount} Chillers Detected`}
                      </span>
                    </div>

                    {fileAnalysis.unitCount === 1 ? (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        Exclusively contains{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                          {fileAnalysis.units[0]}
                        </strong>{" "}
                        ({fileAnalysis.totalRows.toLocaleString()} operational records). Dedicated dual-engine contextual ML models will be fitted for this unit.
                      </div>
                    ) : fileAnalysis.unitCount > 1 ? (
                      <div className="space-y-2">
                        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                          Telemetry for{" "}
                          <strong className="text-cyan-600 dark:text-cyan-400 font-bold">
                            {fileAnalysis.unitCount} distinct chillers
                          </strong>{" "}
                          ({fileAnalysis.totalRows.toLocaleString()} rows):
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {fileAnalysis.units.map((u) => (
                            <span
                              key={u}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
                            >
                              {u}{" "}
                              <span className="text-slate-400 font-normal">
                                ({fileAnalysis.equipments[u].toLocaleString()} rows)
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 text-xs">
                        No equipment identifier column found. Telemetry will be modeled as a single primary chiller.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Trigger Button */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
            <button
              onClick={handleRunPipeline}
              disabled={!file || uploading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-cyan-500/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Fitting Dual-Engine Contextual Models...</span>
                </>
              ) : (
                <>
                  <span>Ingest & Calibrate Fleet Intelligence</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Telemetry Data Contract Checklist */}
        <div className="lg:col-span-5 card-clean p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 font-heading">
                <Layers className="w-4 h-4 text-cyan-500" />
                Data Contract Checklist
              </h2>
              <span className="text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                11 Standard Columns
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-medium">
              Columns are auto-normalized. No manual mapping is required.
            </p>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {schemaColumns.map((col, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-white/[0.05] flex items-center justify-between text-xs hover:border-cyan-500/30 transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block font-heading">
                      {col.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {col.desc}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-800 shadow-2xs font-semibold">
                    {col.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-medium">Missing values are imputed dynamically via chronological forward/backward fill.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
