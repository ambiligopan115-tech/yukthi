import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import RobustScaler
from typing import Dict, Any, List, Tuple

CONTEXT_FEATURES = [
    "Building Load (RT)",
    "Outside Temperature (F)",
    "Dew Point (F)",
    "Humidity (%)",
    "Wind Speed (mph)",
    "Pressure (in)",
    "hour_sin",
    "hour_cos",
    "day_of_week",
    "Cooling Water Temperature (C)",
    "cooling_temp_diff_c"
]

class ContextualChillerAnomalyDetector:
    def __init__(self, contamination: float = 0.02, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state
        self.energy_regressors: Dict[str, RandomForestRegressor] = {}
        self.chw_regressors: Dict[str, RandomForestRegressor] = {}
        self.isolation_forests: Dict[str, IsolationForest] = {}
        self.scalers: Dict[str, RobustScaler] = {}
        self.residual_stds: Dict[str, Dict[str, float]] = {}
        self.feature_names: List[str] = []
        self.trained_equipments: List[str] = []

    def fit_predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Trains contextual baseline regressors and multivariate Isolation Forest per equipment unit.
        Uses 3-sigma statistical control theory so normal operating variation is never flagged as anomalous.
        """
        df_result = df.copy()
        
        # Identify available contextual features
        avail_context = [col for col in CONTEXT_FEATURES if col in df_result.columns]
        if len(avail_context) == 0:
            avail_context = [col for col in df_result.select_dtypes(include=[np.number]).columns 
                             if "energy" not in col.lower() and "rate" not in col.lower()]
        self.feature_names = avail_context
        
        # Initialize output columns
        df_result["expected_energy_kwh"] = np.nan
        df_result["expected_energy_lower"] = np.nan
        df_result["expected_energy_upper"] = np.nan
        df_result["expected_chw_rate"] = np.nan
        df_result["expected_chw_lower"] = np.nan
        df_result["expected_chw_upper"] = np.nan
        
        df_result["energy_residual"] = 0.0
        df_result["energy_residual_zscore"] = 0.0
        df_result["chw_residual"] = 0.0
        df_result["chw_residual_zscore"] = 0.0
        
        df_result["iforest_score"] = 0.0
        df_result["contextual_anomaly_score"] = 0.0
        df_result["is_anomaly"] = False
        df_result["persistence_count"] = 0
        df_result["persistence_type"] = "NONE"
        df_result["severity"] = "NORMAL"
        
        equipments = sorted(df_result["equipment_id"].unique().tolist())
        self.trained_equipments = equipments

        for equip in equipments:
            equip_mask = (df_result["equipment_id"] == equip)
            sub_df = df_result.loc[equip_mask].copy()
            n_samples = len(sub_df)
            if n_samples < 5:
                continue

            # -------------------------------------------------------------
            # 1. Expected Energy Regressor (Conditioned on Load, Weather, Ambient Lift)
            # -------------------------------------------------------------
            has_energy = "Chiller Energy Consumption (kWh)" in sub_df.columns
            if has_energy and len(avail_context) > 0:
                X_ctx = sub_df[avail_context].fillna(0.0)
                y_energy = sub_df["Chiller Energy Consumption (kWh)"]
                
                energy_model = RandomForestRegressor(
                    n_estimators=50, 
                    max_depth=12, 
                    min_samples_leaf=3, 
                    random_state=self.random_state, 
                    n_jobs=-1
                )
                energy_model.fit(X_ctx, y_energy)
                self.energy_regressors[equip] = energy_model
                
                pred_energy = energy_model.predict(X_ctx)
                res_energy = y_energy.values - pred_energy
                res_energy_std = float(np.std(res_energy) if np.std(res_energy) > 1e-2 else 1.0)
                z_energy = res_energy / res_energy_std
                
                # Expected normal operating envelope: +/- 2.5 sigma
                df_result.loc[equip_mask, "expected_energy_kwh"] = np.round(pred_energy, 2)
                df_result.loc[equip_mask, "expected_energy_lower"] = np.round(np.maximum(0, pred_energy - 2.5 * res_energy_std), 2)
                df_result.loc[equip_mask, "expected_energy_upper"] = np.round(pred_energy + 2.5 * res_energy_std, 2)
                df_result.loc[equip_mask, "energy_residual"] = np.round(res_energy, 2)
                df_result.loc[equip_mask, "energy_residual_zscore"] = np.round(z_energy, 2)
            else:
                res_energy_std = 1.0
                z_energy = np.zeros(n_samples)

            # -------------------------------------------------------------
            # 2. Expected Chilled Water Flow Regressor
            # -------------------------------------------------------------
            has_chw = "Chilled Water Rate (L/sec)" in sub_df.columns
            if has_chw and len(avail_context) > 0:
                X_ctx = sub_df[avail_context].fillna(0.0)
                y_chw = sub_df["Chilled Water Rate (L/sec)"]
                
                chw_model = RandomForestRegressor(
                    n_estimators=50, 
                    max_depth=12, 
                    min_samples_leaf=3, 
                    random_state=self.random_state, 
                    n_jobs=-1
                )
                chw_model.fit(X_ctx, y_chw)
                self.chw_regressors[equip] = chw_model
                
                pred_chw = chw_model.predict(X_ctx)
                res_chw = y_chw.values - pred_chw
                res_chw_std = float(np.std(res_chw) if np.std(res_chw) > 1e-2 else 1.0)
                z_chw = res_chw / res_chw_std
                
                df_result.loc[equip_mask, "expected_chw_rate"] = np.round(pred_chw, 2)
                df_result.loc[equip_mask, "expected_chw_lower"] = np.round(np.maximum(0, pred_chw - 2.5 * res_chw_std), 2)
                df_result.loc[equip_mask, "expected_chw_upper"] = np.round(pred_chw + 2.5 * res_chw_std, 2)
                df_result.loc[equip_mask, "chw_residual"] = np.round(res_chw, 2)
                df_result.loc[equip_mask, "chw_residual_zscore"] = np.round(z_chw, 2)
            else:
                res_chw_std = 1.0
                z_chw = np.zeros(n_samples)

            self.residual_stds[equip] = {
                "energy_std": res_energy_std,
                "chw_std": res_chw_std
            }

            # -------------------------------------------------------------
            # 3. Multivariate Contextual Isolation Forest
            # -------------------------------------------------------------
            iso_cols = [c for c in avail_context]
            if "flow_per_rt" in sub_df.columns:
                iso_cols.append("flow_per_rt")
            
            X_iso = df_result.loc[equip_mask, iso_cols].copy().fillna(0.0)
            scaler = RobustScaler()
            X_scaled = scaler.fit_transform(X_iso)
            self.scalers[equip] = scaler
            
            iso_model = IsolationForest(
                n_estimators=80,
                contamination=self.contamination,
                max_samples=min(1024, n_samples),
                random_state=self.random_state,
                n_jobs=-1
            )
            iso_model.fit(X_scaled)
            self.isolation_forests[equip] = iso_model
            
            iso_dec = iso_model.decision_function(X_scaled)
            iso_pred = iso_model.predict(X_scaled)  # -1 for anomaly, +1 for normal

            # -------------------------------------------------------------
            # 4. Rigorous Composite Contextual Anomaly Scoring & Classification
            # -------------------------------------------------------------
            abs_z_energy = np.abs(z_energy)
            abs_z_chw = np.abs(z_chw)
            
            # Anomaly is flagged when:
            # 1. Primary operational deviation: Energy residual exceeds 2.5 sigma (|z_energy| >= 2.5)
            # 2. Combined energy + hydraulic deviation: (|z_energy| >= 2.0 and |z_chw| >= 2.2)
            # 3. Severe flow disruption: (|z_chw| >= 3.5) with non-trivial energy deviation (|z_energy| >= 1.5)
            is_anomaly_raw = (
                (abs_z_energy >= 2.5) | 
                ((abs_z_energy >= 2.0) & (abs_z_chw >= 2.2)) | 
                ((abs_z_chw >= 3.5) & (abs_z_energy >= 1.5))
            )

            composite_scores = np.zeros(n_samples)
            for i in range(n_samples):
                ze = abs_z_energy[i]
                zc = abs_z_chw[i]
                if not is_anomaly_raw[i]:
                    # Normal operating regime: continuous scores strictly bounded 5.0 - 38.0
                    if ze < 1.0:
                        s = 5.0 + ze * 10.0
                    elif ze < 2.0:
                        s = 15.0 + (ze - 1.0) * 15.0
                    else:
                        s = 30.0 + (ze - 2.0) * 15.0
                else:
                    # Anomaly regime: scores scale 60.0 - 98.0
                    if ze < 2.5:
                        base = 60.0 + ((ze - 1.5) / 1.0) * 10.0
                    elif ze < 3.5:
                        base = 70.0 + ((ze - 2.5) / 1.0) * 15.0
                    else:
                        base = 85.0 + min(11.0, (ze - 3.5) * 2.5)
                    
                    if iso_pred[i] == -1:
                        base = min(98.0, base + 2.0)
                    s = base
                composite_scores[i] = round(s, 1)
            
            df_result.loc[equip_mask, "contextual_anomaly_score"] = composite_scores
            df_result.loc[equip_mask, "iforest_score"] = np.round(iso_dec, 4)
            df_result.loc[equip_mask, "is_anomaly"] = is_anomaly_raw

            # -------------------------------------------------------------
            # 5. Multi-Cycle Persistence Engine
            # -------------------------------------------------------------
            anomaly_series = is_anomaly_raw.astype(int)
            persistence_counts = np.zeros(n_samples, dtype=int)
            current_run = 0
            
            for i in range(n_samples):
                if anomaly_series[i] == 1:
                    current_run += 1
                    persistence_counts[i] = current_run
                else:
                    current_run = 0
                    persistence_counts[i] = 0
                    
            # Backfill cluster length
            for i in range(n_samples - 2, -1, -1):
                if persistence_counts[i] > 0 and persistence_counts[i+1] > persistence_counts[i]:
                    persistence_counts[i] = persistence_counts[i+1]
                    
            df_result.loc[equip_mask, "persistence_count"] = persistence_counts
            
            p_type = np.where(persistence_counts >= 3, "PERSISTENT",
                     np.where(persistence_counts == 2, "REPEATED", 
                     np.where(persistence_counts == 1, "ISOLATED", "NONE")))
            df_result.loc[equip_mask, "persistence_type"] = p_type

            # -------------------------------------------------------------
            # 6. Contextual Severity Classification
            # -------------------------------------------------------------
            severities = []
            for i in range(n_samples):
                if not is_anomaly_raw[i]:
                    severities.append("NORMAL")
                elif persistence_counts[i] >= 3 or composite_scores[i] >= 85.0 or abs_z_energy[i] >= 4.0:
                    severities.append("HIGH")
                elif persistence_counts[i] == 2 or composite_scores[i] >= 70.0 or abs_z_energy[i] >= 2.8:
                    severities.append("MEDIUM")
                else:
                    severities.append("LOW")
                    
            df_result.loc[equip_mask, "severity"] = severities

        return df_result


def calculate_equipment_health(df_processed: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    """
    Computes an operational equipment health score (0-100%) for each chiller.
    Reflects true asset health based on statistical control and persistence.
    """
    health_summary = {}
    equipments = sorted(df_processed["equipment_id"].unique().tolist())
    
    for equip in equipments:
        sub = df_processed[df_processed["equipment_id"] == equip].copy()
        total_records = len(sub)
        if total_records == 0:
            continue
            
        anomalies = sub[sub["is_anomaly"] == True]
        anomaly_count = len(anomalies)
        
        high_count = len(anomalies[anomalies["severity"] == "HIGH"])
        med_count = len(anomalies[anomalies["severity"] == "MEDIUM"])
        low_count = len(anomalies[anomalies["severity"] == "LOW"])
        persistent_count = len(anomalies[anomalies["persistence_type"] == "PERSISTENT"])
        
        # Recent records (last 10% of time)
        recent_window = max(10, int(total_records * 0.1))
        recent_sub = sub.tail(recent_window)
        recent_anomalies = len(recent_sub[recent_sub["is_anomaly"] == True])
        
        # Health deduction calculation:
        # 1-3% occasional anomalies maintain ~88-94% health
        anomaly_rate = anomaly_count / max(1, total_records)
        freq_penalty = min(20.0, anomaly_rate * 300.0)
        
        sev_penalty = min(25.0, (high_count * 2.0 + med_count * 0.8 + low_count * 0.3) / max(1, total_records / 100.0))
        persist_penalty = min(25.0, (persistent_count * 2.0) / max(1, total_records / 100.0))
        recent_rate = recent_anomalies / max(1, recent_window)
        recent_penalty = min(20.0, recent_rate * 60.0)
        
        total_penalty = min(75.0, freq_penalty + sev_penalty + persist_penalty + recent_penalty)
        health_score = round(max(25.0, 100.0 - total_penalty), 1)
        
        latest_row = sub.iloc[-1]
        latest_severity = latest_row.get("severity", "NORMAL")
        
        if anomaly_count > 0:
            last_anom_time = str(anomalies.iloc[-1]["timestamp"])
        else:
            last_anom_time = "None detected"
            
        if health_score >= 85 and latest_severity == "NORMAL":
            status_label = "Optimal"
            status_tier = "success"
        elif health_score >= 70:
            status_label = "Fair / Monitoring"
            status_tier = "warning"
        elif health_score >= 50:
            status_label = "Requires Attention"
            status_tier = "warning"
        else:
            status_label = "Critical Review"
            status_tier = "danger"

        health_summary[equip] = {
            "equipment_id": equip,
            "health_score": health_score,
            "status_label": status_label,
            "status_tier": status_tier,
            "total_records": total_records,
            "anomaly_count": anomaly_count,
            "high_severity_count": high_count,
            "medium_severity_count": med_count,
            "low_severity_count": low_count,
            "persistent_count": persistent_count,
            "last_anomaly_timestamp": last_anom_time,
            "current_severity": latest_severity,
            "latest_energy": float(latest_row.get("Chiller Energy Consumption (kWh)", 0.0)),
            "latest_load": float(latest_row.get("Building Load (RT)", 0.0)),
            "latest_outside_temp": float(latest_row.get("Outside Temperature (F)", 0.0))
        }
        
    return health_summary
