import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any, Optional

STANDARD_COLUMNS = {
    "timestamp": "timestamp",
    "equipment_id": "equipment_id",
    "chilled_water_rate": "Chilled Water Rate (L/sec)",
    "cooling_water_temp": "Cooling Water Temperature (C)",
    "building_load": "Building Load (RT)",
    "energy_consumption": "Chiller Energy Consumption (kWh)",
    "outside_temp": "Outside Temperature (F)",
    "dew_point": "Dew Point (F)",
    "humidity": "Humidity (%)",
    "wind_speed": "Wind Speed (mph)",
    "pressure": "Pressure (in)"
}

NUMERIC_COLUMNS = [
    "Chilled Water Rate (L/sec)",
    "Cooling Water Temperature (C)",
    "Building Load (RT)",
    "Chiller Energy Consumption (kWh)",
    "Outside Temperature (F)",
    "Dew Point (F)",
    "Humidity (%)",
    "Wind Speed (mph)",
    "Pressure (in)"
]

def map_and_validate_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Standardize column names across case variations and whitespace.
    Returns normalized dataframe and validation metadata.
    """
    col_map = {}
    lower_to_orig = {col.strip().lower(): col for col in df.columns}
    
    # Map timestamp
    for candidate in ["timestamp", "time", "datetime", "date"]:
        if candidate in lower_to_orig:
            col_map[lower_to_orig[candidate]] = "timestamp"
            break
            
    # Map equipment_id
    for candidate in ["equipment_id", "equipment", "chiller_id", "chiller", "device_id", "unit"]:
        if candidate in lower_to_orig:
            col_map[lower_to_orig[candidate]] = "equipment_id"
            break
            
    # Map numeric columns flexibly
    keywords = {
        "Chilled Water Rate (L/sec)": ["chilled water rate", "chilled_water_flow", "chilled water", "chw_rate"],
        "Cooling Water Temperature (C)": ["cooling water temperature", "cooling_water_temp", "cw_temp", "cooling temp"],
        "Building Load (RT)": ["building load", "load", "building_load_rt", "rt"],
        "Chiller Energy Consumption (kWh)": ["chiller energy consumption", "energy", "energy_kwh", "power", "power_kwh"],
        "Outside Temperature (F)": ["outside temperature", "ambient_temp", "outdoor_temp", "outside temp"],
        "Dew Point (F)": ["dew point", "dewpoint", "dew_point_f"],
        "Humidity (%)": ["humidity", "relative_humidity", "rh"],
        "Wind Speed (mph)": ["wind speed", "wind_speed_mph", "wind"],
        "Pressure (in)": ["pressure", "atmospheric_pressure", "pressure_in"]
    }
    
    for standard_name, aliases in keywords.items():
        if standard_name in df.columns:
            continue
        for alias in aliases:
            for col_lower, orig in lower_to_orig.items():
                if alias in col_lower:
                    col_map[orig] = standard_name
                    break
            if standard_name in col_map.values():
                break

    df_norm = df.rename(columns=col_map).copy()
    
    # Validation info
    missing_required = []
    if "timestamp" not in df_norm.columns:
        missing_required.append("timestamp")
    if "equipment_id" not in df_norm.columns:
        # Default single chiller if not provided
        df_norm["equipment_id"] = "CHILLER-01"
        
    found_numerics = [col for col in NUMERIC_COLUMNS if col in df_norm.columns]
    
    validation = {
        "is_valid": len(missing_required) == 0 and len(found_numerics) >= 2,
        "missing_required": missing_required,
        "present_numeric_columns": found_numerics,
        "missing_numeric_columns": [col for col in NUMERIC_COLUMNS if col not in df_norm.columns],
        "total_rows": len(df_norm),
        "equipments": sorted(df_norm["equipment_id"].dropna().astype(str).unique().tolist()) if "equipment_id" in df_norm.columns else []
    }
    
    return df_norm, validation


def preprocess_chiller_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Cleans, validates, imputes missing values respecting equipment time-series,
    and extracts rich contextual engineering features.
    """
    df_clean, meta = map_and_validate_columns(df)
    if not meta["is_valid"]:
        raise ValueError(f"Invalid dataset schema. Missing required fields: {meta['missing_required']}")
        
    # Convert timestamp
    df_clean["timestamp_dt"] = pd.to_datetime(df_clean["timestamp"], errors="coerce")
    df_clean = df_clean.dropna(subset=["timestamp_dt"])
    df_clean["equipment_id"] = df_clean["equipment_id"].astype(str)
    
    # Sort chronologically by equipment and timestamp
    df_clean = df_clean.sort_values(by=["equipment_id", "timestamp_dt"]).reset_index(drop=True)
    
    # Missing value handling per equipment
    available_numerics = meta["present_numeric_columns"]
    for col in available_numerics:
        df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce")
        # Time-series forward fill, backward fill per equipment
        df_clean[col] = df_clean.groupby("equipment_id")[col].transform(lambda g: g.ffill().bfill())
        # Global median fallback if entire equipment was NaN for that column
        if df_clean[col].isnull().any():
            median_val = df_clean[col].median()
            if pd.isna(median_val):
                median_val = 0.0
            df_clean[col] = df_clean[col].fillna(median_val)
            
    # Temporal & Contextual Feature Engineering
    dt = df_clean["timestamp_dt"].dt
    df_clean["hour"] = dt.hour
    df_clean["day_of_week"] = dt.dayofweek
    df_clean["is_weekend"] = (dt.dayofweek >= 5).astype(int)
    
    # Cyclic encoding for hour
    df_clean["hour_sin"] = np.sin(2 * np.pi * df_clean["hour"] / 24.0)
    df_clean["hour_cos"] = np.cos(2 * np.pi * df_clean["hour"] / 24.0)
    
    # Domain physics contextual indicators
    # 1. kW/RT (Energy per Ton of refrigeration)
    if "Chiller Energy Consumption (kWh)" in df_clean.columns and "Building Load (RT)" in df_clean.columns:
        # Protect against division by zero
        load_safe = np.maximum(df_clean["Building Load (RT)"], 10.0)
        df_clean["specific_power_kw_rt"] = df_clean["Chiller Energy Consumption (kWh)"] / load_safe
    else:
        df_clean["specific_power_kw_rt"] = 0.0
        
    # 2. Flow per Ton (Chilled water circulation rate per load)
    if "Chilled Water Rate (L/sec)" in df_clean.columns and "Building Load (RT)" in df_clean.columns:
        load_safe = np.maximum(df_clean["Building Load (RT)"], 10.0)
        df_clean["flow_per_rt"] = df_clean["Chilled Water Rate (L/sec)"] / load_safe
    else:
        df_clean["flow_per_rt"] = 0.0
        
    # 3. Cooling delta against ambient (approximate cooling tower heat rejection context)
    if "Cooling Water Temperature (C)" in df_clean.columns and "Outside Temperature (F)" in df_clean.columns:
        outside_c = (df_clean["Outside Temperature (F)"] - 32.0) * 5.0 / 9.0
        df_clean["cooling_temp_diff_c"] = df_clean["Cooling Water Temperature (C)"] - outside_c
    else:
        df_clean["cooling_temp_diff_c"] = 0.0
        
    # 4. Rolling short-term statistics (3-step / 1.5h rolling mean to capture trends)
    for col in ["Chiller Energy Consumption (kWh)", "Building Load (RT)", "Chilled Water Rate (L/sec)"]:
        if col in df_clean.columns:
            clean_name = col.split()[0].lower()
            df_clean[f"{clean_name}_roll_mean_3"] = df_clean.groupby("equipment_id")[col].transform(
                lambda g: g.rolling(window=3, min_periods=1).mean()
            )
            df_clean[f"{clean_name}_roll_std_3"] = df_clean.groupby("equipment_id")[col].transform(
                lambda g: g.rolling(window=3, min_periods=1).std().fillna(0.0)
            )

    return df_clean, meta
