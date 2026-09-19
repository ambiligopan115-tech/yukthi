import os
import io
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from ml.preprocessor import preprocess_chiller_data
from ml.contextual_model import ContextualChillerAnomalyDetector, calculate_equipment_health
from ml.explainer import generate_anomaly_explanation
from ml.synthetic import generate_csv_template_content

class ChillerService:
    def __init__(self, default_csv_path: Optional[str] = None):
        self.default_csv_path = default_csv_path
        self.raw_df: Optional[pd.DataFrame] = None
        self.processed_df: Optional[pd.DataFrame] = None
        self.detector: Optional[ContextualChillerAnomalyDetector] = None
        self.equipment_health: Dict[str, Dict[str, Any]] = {}
        self.dataset_meta: Dict[str, Any] = {}
        self.equipment_counts: Dict[str, int] = {}
        self.source_label: str = "No Dataset Loaded"
        
        # Only load if an explicit default_csv_path was passed to constructor
        if self.default_csv_path and os.path.exists(self.default_csv_path):
            self.load_from_csv(self.default_csv_path, source_label=os.path.basename(self.default_csv_path))

    def reset_dataset(self):
        """Clears all in-memory datasets and resets platform state."""
        self.raw_df = None
        self.processed_df = None
        self.detector = None
        self.equipment_health = {}
        self.dataset_meta = {}
        self.equipment_counts = {}
        self.source_label = "No Dataset Loaded"

    def load_from_csv(self, file_path: str, source_label: str = "Uploaded CSV"):
        df = pd.read_csv(file_path)
        eq_cols = [c for c in df.columns if c.strip().lower() in ["equipment_id", "equipment", "chiller_id", "chiller", "unit"]]
        if eq_cols:
            eq_col = eq_cols[0]
            unique_units = [str(u).strip().upper() for u in df[eq_col].dropna().unique()]
            if len(unique_units) == 1:
                source_label = f"{source_label} ({unique_units[0]})"
            else:
                source_label = f"{source_label} ({len(unique_units)} Units: {', '.join(unique_units)})"
        self._process_and_fit(df, source_label=source_label)

    def load_from_dataframe(self, df: pd.DataFrame, source_label: str = "Uploaded CSV"):
        self._process_and_fit(df, source_label=source_label)

    def _process_and_fit(self, df: pd.DataFrame, source_label: str):
        self.raw_df = df
        self.source_label = source_label
        
        # Clean and extract contextual features
        proc_df, meta = preprocess_chiller_data(df)
        self.dataset_meta = meta
        self.equipment_counts = {
            str(eq): int((proc_df["equipment_id"] == eq).sum())
            for eq in sorted(proc_df["equipment_id"].unique().tolist())
        }
        
        # Fit dual-engine contextual ML model
        self.detector = ContextualChillerAnomalyDetector()
        self.processed_df = self.detector.fit_predict(proc_df)
        
        # Assign 0-indexed ID for easy lookup
        self.processed_df["id"] = range(len(self.processed_df))
        
        # Calculate equipment health scores
        self.equipment_health = calculate_equipment_health(self.processed_df)

    def get_overview(self) -> Dict[str, Any]:
        if self.processed_df is None or len(self.processed_df) == 0:
            return {
                "total_chillers": 0,
                "normal_equipment_count": 0,
                "attention_equipment_count": 0,
                "high_severity_anomalies": 0,
                "total_anomalous_periods": 0,
                "total_energy_kwh": 0.0,
                "total_records": 0,
                "dataset_source": self.source_label,
                "is_loaded": False,
                "date_range": None
            }
            
        total_chillers = len(self.equipment_health)
        normal_count = sum(1 for h in self.equipment_health.values() if h.get("status_tier") == "success")
        attention_count = total_chillers - normal_count
        
        anomalies = self.processed_df[self.processed_df["is_anomaly"] == True]
        high_sev = len(anomalies[anomalies["severity"] == "HIGH"])
        total_anom = len(anomalies)
        
        total_energy = float(self.processed_df["Chiller Energy Consumption (kWh)"].sum()) if "Chiller Energy Consumption (kWh)" in self.processed_df.columns else 0.0
        
        min_date = str(self.processed_df["timestamp"].min())
        max_date = str(self.processed_df["timestamp"].max())
        
        return {
            "total_chillers": total_chillers,
            "normal_equipment_count": normal_count,
            "attention_equipment_count": attention_count,
            "high_severity_anomalies": high_sev,
            "total_anomalous_periods": total_anom,
            "total_energy_kwh": round(total_energy, 1),
            "total_records": len(self.processed_df),
            "dataset_source": self.source_label,
            "equipment_breakdown": self.equipment_counts,
            "is_loaded": True,
            "date_range": {
                "start": min_date,
                "end": max_date
            }
        }

    def get_equipments(self) -> List[Dict[str, Any]]:
        if self.processed_df is None:
            return []
        return list(self.equipment_health.values())

    def get_timeseries(
        self, 
        equipment_id: str, 
        start_date: Optional[str] = None, 
        end_date: Optional[str] = None, 
        max_points: int = 1200
    ) -> List[Dict[str, Any]]:
        if self.processed_df is None:
            return []
            
        mask = (self.processed_df["equipment_id"] == equipment_id)
        sub = self.processed_df.loc[mask].copy()
        
        if start_date:
            sub = sub[sub["timestamp"] >= start_date]
        if end_date:
            sub = sub[sub["timestamp"] <= end_date]
            
        n = len(sub)
        if n == 0:
            return []
            
        if n > max_points:
            step = max(1, n // max_points)
            uniform_indices = set(sub.index[::step])
            anom_indices = set(sub[sub["is_anomaly"] == True].index)
            combined = sorted(list(uniform_indices.union(anom_indices)))
            sub = sub.loc[combined]

        records = []
        for _, row in sub.iterrows():
            records.append({
                "id": int(row["id"]),
                "timestamp": str(row["timestamp"]),
                "energy": float(row["Chiller Energy Consumption (kWh)"]) if pd.notna(row.get("Chiller Energy Consumption (kWh)")) else None,
                "expected_energy": float(row["expected_energy_kwh"]) if pd.notna(row.get("expected_energy_kwh")) else None,
                "expected_energy_lower": float(row["expected_energy_lower"]) if pd.notna(row.get("expected_energy_lower")) else None,
                "expected_energy_upper": float(row["expected_energy_upper"]) if pd.notna(row.get("expected_energy_upper")) else None,
                "building_load": float(row["Building Load (RT)"]) if pd.notna(row.get("Building Load (RT)")) else None,
                "chw_rate": float(row["Chilled Water Rate (L/sec)"]) if pd.notna(row.get("Chilled Water Rate (L/sec)")) else None,
                "expected_chw_rate": float(row["expected_chw_rate"]) if pd.notna(row.get("expected_chw_rate")) else None,
                "cooling_water_temp": float(row["Cooling Water Temperature (C)"]) if pd.notna(row.get("Cooling Water Temperature (C)")) else None,
                "outside_temp": float(row["Outside Temperature (F)"]) if pd.notna(row.get("Outside Temperature (F)")) else None,
                "humidity": float(row["Humidity (%)"]) if pd.notna(row.get("Humidity (%)")) else None,
                "is_anomaly": bool(row.get("is_anomaly", False)),
                "anomaly_score": float(row["contextual_anomaly_score"]) if pd.notna(row.get("contextual_anomaly_score")) else 0.0,
                "severity": str(row.get("severity", "NORMAL"))
            })
            
        return records

    def get_anomalies(
        self, 
        equipment_id: Optional[str] = None, 
        severity: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        if self.processed_df is None:
            return {"total": 0, "offset": offset, "limit": limit, "items": []}
            
        anom_mask = (self.processed_df["is_anomaly"] == True)
        if equipment_id and equipment_id != "ALL":
            anom_mask = anom_mask & (self.processed_df["equipment_id"] == equipment_id)
        if severity and severity != "ALL":
            anom_mask = anom_mask & (self.processed_df["severity"] == severity)
            
        filtered = self.processed_df.loc[anom_mask].sort_values(
            by=["contextual_anomaly_score", "timestamp"], 
            ascending=[False, False]
        )
        total_count = len(filtered)
        paginated = filtered.iloc[offset : offset + limit]
        
        items = []
        for _, row in paginated.iterrows():
            items.append({
                "id": int(row["id"]),
                "timestamp": str(row["timestamp"]),
                "equipment_id": str(row["equipment_id"]),
                "anomaly_score": float(row["contextual_anomaly_score"]),
                "severity": str(row["severity"]),
                "persistence_type": str(row["persistence_type"]),
                "persistence_count": int(row["persistence_count"]),
                "energy_actual": float(row.get("Chiller Energy Consumption (kWh)", 0.0)),
                "energy_expected": float(row["expected_energy_kwh"]) if pd.notna(row.get("expected_energy_kwh")) else None,
                "building_load": float(row.get("Building Load (RT)", 0.0)),
                "chw_flow_actual": float(row.get("Chilled Water Rate (L/sec)", 0.0)),
                "chw_flow_expected": float(row["expected_chw_rate"]) if pd.notna(row.get("expected_chw_rate")) else None,
                "outside_temp": float(row.get("Outside Temperature (F)", 0.0)),
                "cooling_water_temp": float(row.get("Cooling Water Temperature (C)", 0.0))
            })
            
        return {
            "total": total_count,
            "offset": offset,
            "limit": limit,
            "items": items
        }

    def get_anomaly_detail(self, item_id: int) -> Optional[Dict[str, Any]]:
        if self.processed_df is None or item_id not in self.processed_df["id"].values:
            return None
            
        row = self.processed_df.loc[self.processed_df["id"] == item_id].iloc[0]
        explanation = generate_anomaly_explanation(row)
        explanation["id"] = item_id
        return explanation

    def get_ml_insights(self) -> Dict[str, Any]:
        if self.processed_df is None:
            return {
                "model_name": "Dual-Engine Contextual Anomaly Engine",
                "methodology": "Expected-vs-Observed Baseline Regressors (Random Forest) + Multivariate Isolation Forest",
                "contamination_rate": 0.035,
                "context_features_used": [],
                "total_observations_analyzed": 0,
                "total_anomalies_detected": 0,
                "chiller_breakdown": {},
                "why_contextual": (
                    "Chillers operate under continuously shifting ambient weather and building occupant loads. "
                    "A simple fixed threshold triggers false alarms during peak summer days and misses severe faults during mild weather. "
                    "Our contextual ML learns dynamic operational baselines conditioned on ambient load and thermodynamic balance."
                )
            }
            
        chiller_stats = {}
        for equip, h in self.equipment_health.items():
            chiller_stats[equip] = {
                "health_score": h["health_score"],
                "total_observations": h["total_records"],
                "anomalies": h["anomaly_count"],
                "high_severity": h["high_severity_count"],
                "persistent_periods": h["persistent_count"]
            }
            
        total_anom = int(self.processed_df["is_anomaly"].sum())
        
        return {
            "model_name": "Dual-Engine Contextual Anomaly Engine",
            "methodology": "Expected-vs-Observed Baseline Regressors (Random Forest) + Multivariate Isolation Forest",
            "contamination_rate": 0.035,
            "context_features_used": self.detector.feature_names if self.detector else [],
            "total_observations_analyzed": len(self.processed_df),
            "total_anomalies_detected": total_anom,
            "chiller_breakdown": chiller_stats,
            "why_contextual": (
                "Chillers operate under continuously shifting ambient weather and building occupant loads. "
                "A simple fixed threshold (e.g. Energy > 130 kWh) triggers false alarms during legitimate peak summer heat waves, "
                "while failing to detect severe heat-exchanger scaling or valve faults during mild 68°F weather. "
                "Our contextual model learns E[Energy | Load, Weather, Hour] dynamically, flagging points only when actual "
                "behaviour contradicts its expected thermodynamic state."
            )
        }

    def get_csv_template(self) -> str:
        """Returns standard production CSV template."""
        return generate_csv_template_content()

    def export_anomalies_csv(self) -> str:
        """Generates CSV text of all detected contextual anomalies."""
        if self.processed_df is None:
            return "No data available\n"
            
        anom = self.processed_df[self.processed_df["is_anomaly"] == True].copy()
        if len(anom) == 0:
            return "No anomalies detected\n"
            
        export_cols = [
            "id", "timestamp", "equipment_id", "severity", "persistence_type",
            "persistence_count", "contextual_anomaly_score", "Chiller Energy Consumption (kWh)",
            "expected_energy_kwh", "Building Load (RT)", "Chilled Water Rate (L/sec)",
            "expected_chw_rate", "Outside Temperature (F)", "Cooling Water Temperature (C)"
        ]
        available_cols = [c for c in export_cols if c in anom.columns]
        output = io.StringIO()
        anom[available_cols].to_csv(output, index=False)
        return output.getvalue()
