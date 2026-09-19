from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class OverviewStats(BaseModel):
    total_chillers: int
    normal_equipment_count: int
    attention_equipment_count: int
    high_severity_anomalies: int
    total_anomalous_periods: int
    total_energy_kwh: float
    total_records: int
    dataset_source: str
    date_range: Dict[str, str]

class EquipmentSummary(BaseModel):
    equipment_id: str
    health_score: float
    status_label: str
    status_tier: str
    total_records: int
    anomaly_count: int
    high_severity_count: int
    medium_severity_count: int
    low_severity_count: int
    persistent_count: int
    last_anomaly_timestamp: str
    current_severity: str
    latest_energy: float
    latest_load: float
    latest_outside_temp: float

class AnomalyItem(BaseModel):
    id: int
    timestamp: str
    equipment_id: str
    anomaly_score: float
    severity: str
    persistence_type: str
    persistence_count: int
    energy_actual: float
    energy_expected: Optional[float]
    building_load: float
    chw_flow_actual: float
    chw_flow_expected: Optional[float]
    outside_temp: float
    cooling_water_temp: float

class MetricComparison(BaseModel):
    actual: float
    expected: float
    normal_range: List[float]
    unit: str
    diff_pct: float
    status: str

class AnomalyDetail(BaseModel):
    id: int
    timestamp: str
    equipment_id: str
    anomaly_score: float
    severity: str
    persistence_type: str
    persistence_count: int
    metrics: Dict[str, MetricComparison]
    contributing_factors: List[Dict[str, Any]]
    context: Dict[str, Any]
    evidence: List[str]
    recommendations: List[str]

class TimeSeriesPoint(BaseModel):
    timestamp: str
    energy: Optional[float] = None
    expected_energy: Optional[float] = None
    expected_energy_lower: Optional[float] = None
    expected_energy_upper: Optional[float] = None
    building_load: Optional[float] = None
    chw_rate: Optional[float] = None
    expected_chw_rate: Optional[float] = None
    cooling_water_temp: Optional[float] = None
    outside_temp: Optional[float] = None
    humidity: Optional[float] = None
    is_anomaly: bool = False
    anomaly_score: Optional[float] = None
    severity: Optional[str] = None

class MLInsights(BaseModel):
    model_name: str
    methodology: str
    contamination_rate: float
    context_features_used: List[str]
    total_observations_analyzed: int
    total_anomalies_detected: int
    chiller_breakdown: Dict[str, Any]
    why_contextual: str
