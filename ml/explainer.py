import pandas as pd
import numpy as np
from typing import Dict, Any, List

def generate_anomaly_explanation(row: pd.Series, equipment_medians: Dict[str, float] = None) -> Dict[str, Any]:
    """
    Generates a structured, evidence-based contextual diagnostic explanation
    for a single anomalous observation.
    """
    actual_energy = float(row.get("Chiller Energy Consumption (kWh)", 0.0))
    expected_energy = float(row.get("expected_energy_kwh", actual_energy))
    energy_lower = float(row.get("expected_energy_lower", expected_energy * 0.9))
    energy_upper = float(row.get("expected_energy_upper", expected_energy * 1.1))
    energy_residual = float(row.get("energy_residual", actual_energy - expected_energy))
    energy_z = float(row.get("energy_residual_zscore", 0.0))

    actual_chw = float(row.get("Chilled Water Rate (L/sec)", 0.0))
    expected_chw = float(row.get("expected_chw_rate", actual_chw))
    chw_lower = float(row.get("expected_chw_lower", expected_chw * 0.9))
    chw_upper = float(row.get("expected_chw_upper", expected_chw * 1.1))
    chw_residual = float(row.get("chw_residual", actual_chw - expected_chw))
    chw_z = float(row.get("chw_residual_zscore", 0.0))

    load = float(row.get("Building Load (RT)", 0.0))
    cw_temp = float(row.get("Cooling Water Temperature (C)", 0.0))
    outside_temp = float(row.get("Outside Temperature (F)", 0.0))
    dew_point = float(row.get("Dew Point (F)", 0.0))
    humidity = float(row.get("Humidity (%)", 0.0))
    wind_speed = float(row.get("Wind Speed (mph)", 0.0))
    pressure = float(row.get("Pressure (in)", 0.0))

    anomaly_score = float(row.get("contextual_anomaly_score", 0.0))
    severity = str(row.get("severity", "LOW"))
    persistence_type = str(row.get("persistence_type", "ISOLATED"))
    persistence_count = int(row.get("persistence_count", 1))

    # Calculate percentage differences
    energy_pct_diff = round(((actual_energy - expected_energy) / max(1.0, expected_energy)) * 100, 1)
    chw_pct_diff = round(((actual_chw - expected_chw) / max(1.0, expected_chw)) * 100, 1)

    # 1. Contributing factors ranking
    contributing_factors = []
    
    if abs(energy_z) >= 1.5:
        contributing_factors.append({
            "feature": "Energy Consumption",
            "impact": "High" if abs(energy_z) >= 3.0 else "Moderate",
            "direction": "Above Expected" if energy_residual > 0 else "Below Expected",
            "deviation_pct": energy_pct_diff,
            "z_score": round(energy_z, 2)
        })
        
    if abs(chw_z) >= 1.5:
        contributing_factors.append({
            "feature": "Chilled Water Flow",
            "impact": "High" if abs(chw_z) >= 3.0 else "Moderate",
            "direction": "Above Expected" if chw_residual > 0 else "Below Expected",
            "deviation_pct": chw_pct_diff,
            "z_score": round(chw_z, 2)
        })
        
    # Cooling delta factor
    cooling_delta = float(row.get("cooling_temp_diff_c", 0.0))
    if cooling_delta > 15.0 or cooling_delta < -5.0:
        contributing_factors.append({
            "feature": "Cooling Tower Lift / Heat Rejection",
            "impact": "Moderate",
            "direction": "Elevated CW Temp" if cooling_delta > 15.0 else "Depressed CW Temp",
            "deviation_pct": round(cooling_delta, 1),
            "z_score": 2.0
        })

    if not contributing_factors:
        contributing_factors.append({
            "feature": "Multivariate Context Interaction",
            "impact": "Moderate",
            "direction": "Non-linear joint deviation",
            "deviation_pct": round(anomaly_score, 1),
            "z_score": 1.8
        })

    # Sort contributing factors by impact
    contributing_factors = sorted(contributing_factors, key=lambda x: abs(x.get("z_score", 0)), reverse=True)

    # 2. Evidence points (Evidence-based statements)
    evidence = []
    
    if energy_pct_diff > 15.0:
        evidence.append(
            f"Chiller energy consumption ({actual_energy:.1f} kWh) is {energy_pct_diff}% higher than the expected contextual baseline ({expected_energy:.1f} kWh) for a building load of {load:.0f} RT."
        )
    elif energy_pct_diff < -20.0 and actual_energy > 0:
        evidence.append(
            f"Chiller energy consumption ({actual_energy:.1f} kWh) is unusually low for the current operational load ({load:.0f} RT), potentially indicating partial unloading or measurement delay."
        )

    if chw_pct_diff > 15.0:
        evidence.append(
            f"Chilled-water flow ({actual_chw:.1f} L/s) exceeds the contextual normal band ({chw_lower:.1f} - {chw_upper:.1f} L/s) by {chw_pct_diff}%."
        )
    elif chw_pct_diff < -15.0:
        evidence.append(
            f"Chilled-water flow ({actual_chw:.1f} L/s) is depressed below expected normal range ({chw_lower:.1f} - {chw_upper:.1f} L/s)."
        )

    # Contextual check: Did ambient conditions justify the behaviour?
    if outside_temp < 80.0 and energy_pct_diff > 15.0:
        evidence.append(
            f"Moderate ambient temperature ({outside_temp:.1f}°F) and humidity ({humidity:.0f}%) do not account for the elevated power draw."
        )
    elif outside_temp >= 90.0:
        evidence.append(
            f"High outdoor ambient temperature ({outside_temp:.1f}°F) is creating severe heat rejection conditions, but power draw exceeds typical hot-weather profiles."
        )

    if persistence_count >= 3:
        evidence.append(
            f"Deviation is PERSISTENT across {persistence_count} consecutive 30-minute intervals ({persistence_count * 0.5:.1f} hours total), indicating a sustained operational state rather than transient sensor noise."
        )
    elif persistence_count == 2:
        evidence.append(
            f"Deviation repeated across 2 consecutive measurement cycles, suggesting emerging trend."
        )
    else:
        evidence.append(
            "Isolated event: This point represents a single 30-minute window deviation."
        )

    # 3. Actionable Recommendations (Evidence-based, no wild claims)
    recommendations = []
    
    if energy_pct_diff > 20.0 and chw_pct_diff < -10.0:
        recommendations.append("Investigate chilled water flow restriction or valve positioning causing reduced flow while energy remains high.")
        recommendations.append("Review evaporator approach temperature and heat exchanger surfaces for potential scaling or fouling.")
    elif energy_pct_diff > 15.0:
        recommendations.append("Compare current energy consumption with similar load and ambient operating conditions in historical logs.")
        recommendations.append("Verify compressor guide vane position and lift pressure across the condenser.")
    
    if abs(chw_pct_diff) > 20.0:
        recommendations.append("Verify chilled-water differential pressure sensor and flow transmitter calibration.")
        recommendations.append("Check secondary loop bypass valve modulation status.")

    if cw_temp > 34.0:
        recommendations.append("Inspect cooling tower fan stages and condenser water inlet temperature.")

    if persistence_count >= 3:
        recommendations.append("High priority: Schedule operational audit due to sustained multi-hour deviation.")
    else:
        recommendations.append("Monitor subsequent 30-minute intervals to determine whether this condition self-resolves or persists.")

    # Context snapshot
    context_summary = {
        "building_load_rt": load,
        "load_status": "High Peak" if load > 550 else ("Moderate" if load > 350 else "Low / Part Load"),
        "outside_temp_f": outside_temp,
        "ambient_status": "Hot" if outside_temp > 85 else ("Mild" if outside_temp > 65 else "Cool"),
        "humidity_pct": humidity,
        "dew_point_f": dew_point,
        "cooling_water_temp_c": cw_temp,
        "wind_speed_mph": wind_speed,
        "pressure_in": pressure
    }

    return {
        "timestamp": str(row.get("timestamp")),
        "equipment_id": str(row.get("equipment_id")),
        "anomaly_score": anomaly_score,
        "severity": severity,
        "persistence_type": persistence_type,
        "persistence_count": persistence_count,
        "metrics": {
            "energy_consumption": {
                "actual": round(actual_energy, 2),
                "expected": round(expected_energy, 2),
                "normal_range": [round(energy_lower, 2), round(energy_upper, 2)],
                "unit": "kWh",
                "diff_pct": energy_pct_diff,
                "status": "Normal" if abs(energy_pct_diff) <= 12 else ("Elevated" if energy_pct_diff > 0 else "Depressed")
            },
            "chilled_water_rate": {
                "actual": round(actual_chw, 2),
                "expected": round(expected_chw, 2),
                "normal_range": [round(chw_lower, 2), round(chw_upper, 2)],
                "unit": "L/sec",
                "diff_pct": chw_pct_diff,
                "status": "Normal" if abs(chw_pct_diff) <= 12 else ("Elevated" if chw_pct_diff > 0 else "Depressed")
            }
        },
        "contributing_factors": contributing_factors,
        "context": context_summary,
        "evidence": evidence,
        "recommendations": recommendations
    }
