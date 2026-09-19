import React, { useState, useEffect, useCallback } from "react";
import {
  fetchOverview,
  fetchEquipments,
  fetchTimeseries,
  fetchAnomalies,
  fetchAnomalyDetail,
  fetchMLInsights,
  resetDataset
} from "./api";

import Navbar from "./components/Navbar";
import OverviewCards from "./components/OverviewCards";
import EquipmentGrid from "./components/EquipmentGrid";
import TimeSeriesChart from "./components/TimeSeriesChart";
import AnomalyTable from "./components/AnomalyTable";
import AnomalyModal from "./components/AnomalyModal";
import MLInsightsModal from "./components/MLInsightsModal";
import UploadModal from "./components/UploadModal";
import EmptyOnboarding from "./components/EmptyOnboarding";

import { Loader2, AlertTriangle, RefreshCw, UploadCloud, Layers, LineChart, AlertCircle, Cpu, Radio, Sparkles } from "lucide-react";

export default function App() {
  const [overview, setOverview] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [timeseries, setTimeseries] = useState([]);
  const [anomalies, setAnomalies] = useState({ total: 0, items: [] });
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | timeseries | anomalies | ml-insights
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("yukthi-theme") === "dark";
  });

  // Modals & Details
  const [selectedAnomalyDetail, setSelectedAnomalyDetail] = useState(null);
  const [mlInsights, setMLInsights] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMLInsightsModalOpen, setIsMLInsightsModalOpen] = useState(false);

  // Loading & Error States
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingTimeseries, setLoadingTimeseries] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Synchronize theme class on html element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("yukthi-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("yukthi-theme", "light");
    }
  }, [isDark]);

  // Initial load
  const loadFleetData = useCallback(async () => {
    try {
      setErrorMsg(null);
      const [ov, eqs, anoms, insights] = await Promise.all([
        fetchOverview(),
        fetchEquipments(),
        fetchAnomalies(null, null, 100),
        fetchMLInsights()
      ]);

      setOverview(ov);
      setEquipments(eqs);
      setAnomalies(anoms);
      setMLInsights(insights);

      if (eqs && eqs.length > 0) {
        if (!selectedEquipment || !eqs.some((e) => e.equipment_id === selectedEquipment)) {
          setSelectedEquipment(eqs[0].equipment_id);
        }
      } else {
        setSelectedEquipment("");
        setTimeseries([]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to connect to backend service.");
    } finally {
      setLoadingInitial(false);
    }
  }, [selectedEquipment]);

  useEffect(() => {
    loadFleetData();
  }, [loadFleetData]);

  // Load timeseries whenever selectedEquipment changes
  useEffect(() => {
    if (!selectedEquipment) return;
    let isMounted = true;

    async function loadSeries() {
      try {
        setLoadingTimeseries(true);
        const data = await fetchTimeseries(selectedEquipment, null, null, 1000);
        if (isMounted) setTimeseries(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingTimeseries(false);
      }
    }

    loadSeries();
    return () => {
      isMounted = false;
    };
  }, [selectedEquipment]);

  // Ensure timeseries data is loaded when switching to timeseries tab
  useEffect(() => {
    if (activeTab === "timeseries" && selectedEquipment && (!timeseries || timeseries.length === 0) && !loadingTimeseries) {
      let isMounted = true;
      async function reloadSeries() {
        try {
          setLoadingTimeseries(true);
          const data = await fetchTimeseries(selectedEquipment, null, null, 1000);
          if (isMounted) setTimeseries(data);
        } catch (err) {
          console.error("Failed to load timeseries on tab switch:", err);
        } finally {
          if (isMounted) setLoadingTimeseries(false);
        }
      }
      reloadSeries();
      return () => {
        isMounted = false;
      };
    }
  }, [activeTab, selectedEquipment, timeseries, loadingTimeseries]);

  // Handle anomaly filter changes
  const handleFilterEquipment = async (eqId) => {
    try {
      const data = await fetchAnomalies(eqId, selectedSeverity, 100);
      setAnomalies(data);
      if (eqId !== "ALL") {
        setSelectedEquipment(eqId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterSeverity = async (sev) => {
    try {
      setSelectedSeverity(sev);
      const data = await fetchAnomalies(selectedEquipment || null, sev, 100);
      setAnomalies(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Open detailed anomaly explanation modal
  const handleSelectAnomaly = async (anomalyId) => {
    try {
      const detail = await fetchAnomalyDetail(anomalyId);
      setSelectedAnomalyDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };

  // Reset/Clear active dataset
  const handleResetDataset = async () => {
    if (!window.confirm("Are you sure you want to unload the dataset and return to the onboarding terminal?")) {
      return;
    }
    try {
      setLoadingAction(true);
      await resetDataset();
      await loadFleetData();
      setSelectedEquipment("");
      setTimeseries([]);
      setActiveTab("dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to reset dataset.");
    } finally {
      setLoadingAction(false);
    }
  };

  const isDatasetLoaded = overview?.is_loaded && (overview?.total_records || 0) > 0;

  return (
    <div className={`min-h-screen ${isDark ? "cyber-grid-dark bg-[#06080e]" : "cyber-grid-light bg-slate-50"} text-slate-800 dark:text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-700 relative overflow-hidden transition-colors duration-300`}>
      
      {/* Ambient Lighting Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[400px] bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[160px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[400px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Top Floating Navigation */}
      <div className="relative z-40">
        <Navbar
          overview={overview}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDark={isDark}
          setIsDark={setIsDark}
          onOpenUpload={() => setIsUploadOpen(true)}
          onResetDataset={handleResetDataset}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 relative z-10">
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 flex items-center justify-between text-xs backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
            <button
              onClick={loadFleetData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer transition-transform hover:scale-105"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          </div>
        )}

        {/* Initial Loading Spinner */}
        {loadingInitial ? (
          <div className="h-[65vh] flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
              <div className="absolute w-20 h-20 rounded-full bg-cyan-500/20 blur-xl"></div>
            </div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white font-heading">
              Connecting to Contextual ML Engine...
            </p>
            <p className="text-xs text-slate-500 font-mono">
              Verifying production health & thermodynamic regressors
            </p>
          </div>
        ) : !isDatasetLoaded ? (
          /* EMPTY ONBOARDING STATE */
          <EmptyOnboarding
            onUploadSuccess={() => {
              loadFleetData();
            }}
          />
        ) : (
          /* LOADED DATASET DASHBOARD VIEWS */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* TAB 1: FLEET DASHBOARD */}
            {activeTab === "dashboard" && (
              <>
                <OverviewCards overview={overview} />
                <EquipmentGrid
                  equipments={equipments}
                  selectedEquipment={selectedEquipment}
                  onSelectEquipment={(id) => setSelectedEquipment(id)}
                  onViewTimeseries={() => setActiveTab("timeseries")}
                />
                <AnomalyTable
                  anomalies={anomalies}
                  equipments={equipments}
                  selectedEquipment={selectedEquipment}
                  onFilterEquipment={handleFilterEquipment}
                  selectedSeverity={selectedSeverity}
                  onFilterSeverity={handleFilterSeverity}
                  onSelectAnomaly={handleSelectAnomaly}
                />
              </>
            )}

            {/* TAB 2: TIME-SERIES ANALYSIS */}
            {activeTab === "timeseries" && (
              <>
                {loadingTimeseries ? (
                  <div className="card-clean p-16 text-center mb-6 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                    <span className="text-xs text-slate-500 font-mono">Extracting telemetry slice for {selectedEquipment}...</span>
                  </div>
                ) : (
                  <TimeSeriesChart
                    timeseries={timeseries}
                    selectedEquipment={selectedEquipment}
                    equipments={equipments}
                    onSelectEquipment={(id) => setSelectedEquipment(id)}
                    onSelectAnomaly={handleSelectAnomaly}
                    isDark={isDark}
                  />
                )}
                {/* Secondary list of anomalies for quick reference */}
                <AnomalyTable
                  anomalies={anomalies}
                  equipments={equipments}
                  selectedEquipment={selectedEquipment}
                  onFilterEquipment={handleFilterEquipment}
                  selectedSeverity={selectedSeverity}
                  onFilterSeverity={handleFilterSeverity}
                  onSelectAnomaly={handleSelectAnomaly}
                />
              </>
            )}

            {/* TAB 3: ANOMALY DIAGNOSTICS */}
            {activeTab === "anomalies" && (
              <>
                <AnomalyTable
                  anomalies={anomalies}
                  equipments={equipments}
                  selectedEquipment={selectedEquipment}
                  onFilterEquipment={handleFilterEquipment}
                  selectedSeverity={selectedSeverity}
                  onFilterSeverity={handleFilterSeverity}
                  onSelectAnomaly={handleSelectAnomaly}
                />
              </>
            )}

            {/* TAB 4: ML METHODOLOGY & INSIGHTS */}
            {activeTab === "ml-insights" && (
              <MLInsightsModal
                mlInsights={mlInsights}
                isModal={false}
              />
            )}
          </div>
        )}
      </main>

      {/* Aesthetic High-Tech Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/[0.06] bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl py-4 px-6 text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <span className="font-extrabold text-slate-900 dark:text-white font-heading tracking-wide">CHILLER AI</span>
            <span>&bull; Intelligent Contextual Telemetry Observatory</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Thermodynamic Control • Zero Static Thresholds
            </span>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold">
              Contextual ML Engine v1.1
            </span>
          </div>
        </div>
      </footer>

      {/* Modal Dialogs */}
      {selectedAnomalyDetail && (
        <AnomalyModal
          anomalyDetail={selectedAnomalyDetail}
          onClose={() => setSelectedAnomalyDetail(null)}
        />
      )}

      {isMLInsightsModalOpen && (
        <MLInsightsModal
          mlInsights={mlInsights}
          onClose={() => setIsMLInsightsModalOpen(false)}
          isModal={true}
        />
      )}

      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            loadFleetData();
          }}
        />
      )}
    </div>
  );
}
