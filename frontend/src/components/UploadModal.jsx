import React, { useState } from "react";
import { X, UploadCloud, FileText, AlertTriangle, Loader2, Cpu, Sparkles } from "lucide-react";
import { uploadDataset } from "../api";

export default function UploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      processFile(selected);
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

  const handleUploadSubmit = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }
    try {
      setUploading(true);
      setError(null);
      const res = await uploadDataset(file);
      onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to process and analyze dataset.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="card-clean max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Illuminated Top Hairline */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-500">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
                Upload Facility Telemetry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Dual-engine machine learning calibration & anomaly scoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Dropzone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-7 text-center transition-all duration-300 cursor-pointer select-none overflow-hidden group ${
              dragActive
                ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,0.25)]"
                : "border-slate-300 dark:border-slate-700/80 hover:border-cyan-400 dark:hover:border-cyan-500/80 bg-slate-50/50 dark:bg-slate-950/40"
            }`}
          >
            {/* Full-coverage Native File Input */}
            <input
              id="modal-file-upload"
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
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6 text-cyan-500" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1 font-heading">
                Drag & drop your CSV telemetry here
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-3 font-medium">or click anywhere to browse from disk</p>
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-xs">
                <span>Browse File</span>
              </div>
            </div>
          </div>

          {/* Selected File */}
          {file && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-cyan-500" />
                <span className="font-mono font-bold text-slate-900 dark:text-white truncate max-w-[260px]">
                  {file.name}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setFileAnalysis(null);
                }}
                className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Automated CSV Structure Analysis Preview */}
          {fileAnalysis && !fileAnalysis.analyzing && (
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5 font-heading">
                  <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                  Structure Discovery
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
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
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  Dataset exclusively contains{" "}
                  <strong className="text-emerald-500 dark:text-emerald-400 font-bold font-mono">
                    {fileAnalysis.units[0]}
                  </strong>{" "}
                  ({fileAnalysis.totalRows.toLocaleString()} operational records). Dedicated dual-engine models will be fitted for this unit.
                </p>
              ) : fileAnalysis.unitCount > 1 ? (
                <div className="space-y-1.5">
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    Telemetry for{" "}
                    <strong className="text-cyan-600 dark:text-cyan-400 font-bold">
                      {fileAnalysis.unitCount} distinct chillers
                    </strong>{" "}
                    ({fileAnalysis.totalRows.toLocaleString()} total rows):
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {fileAnalysis.units.map((u) => (
                      <span
                        key={u}
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-2xs"
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

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUploadSubmit}
            disabled={!file || uploading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-500/25"
          >
            {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
            <span>{uploading ? "Analyzing Telemetry..." : "Run ML Pipeline"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
