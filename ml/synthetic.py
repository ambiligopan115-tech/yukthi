"""
Production Data Contract & Template Specification for Chiller Telemetry.
Defines required standard fields, aliases, and clean CSV template generation.
"""
from typing import List

STANDARD_COLUMNS: List[str] = [
    "timestamp",
    "equipment_id",
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

def generate_csv_template_content() -> str:
    """
    Returns an empty CSV template with header comments and standard columns
    ready for production telemetry ingestion.
    """
    header = ",".join(STANDARD_COLUMNS)
    sample_row = "2026-01-01 00:00:00,CHILLER-01,75.2,28.4,285.0,72.4,72.5,65.0,77.0,8.5,29.92"
    return f"{header}\n{sample_row}\n"
