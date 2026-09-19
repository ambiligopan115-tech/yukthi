# YUKTHI 2026: Intelligent Chiller Contextual Anomaly Detection Platform

An enterprise-grade, data-driven machine learning monitoring platform designed to detect, diagnose, and explain **contextual anomalies** in chiller and HVAC operational datasets without relying on static thresholds.

---

## 1. Problem Statement & Background

Modern commercial and industrial facilities rely heavily on energy-intensive chillers to maintain occupant comfort and critical process cooling. Traditional building management systems (BMS) rely on **static threshold rules** (e.g., `Energy > 130 kWh` or `Flow < 60 L/s`).

### Why Static Thresholds Fail
- **False Positives during Hot Peak Days**: During an extreme 95°F afternoon under 600 RT building load, a chiller consuming 140 kWh is operating normally under high lift and severe load conditions. Fixed thresholds trigger false alarms.
- **False Negatives during Mild Weather**: During a mild 68°F evening under partial 250 RT load, if a chiller consumes 115 kWh due to condenser tube fouling or guide-vane misalignment, static thresholds fail to flag it because 115 kWh is below the fixed 130 kWh limit.
- **Multivariate Interdependence**: Chiller performance is fundamentally governed by thermodynamics—linking energy consumption, refrigerant lift, chilled water circulation, and ambient wet-bulb temperatures.

---

## 2. Our Solution: Contextual Machine Learning

Our system learns expected operational behaviour conditioned on operating and environmental context:
$$\text{Expected Energy} = \mathbb{E}[\text{Energy} \mid \text{Building Load, Ambient Temp, Wet Bulb, Time-of-Day}]$$

An anomaly is flagged **only when the observed equipment behaviour significantly contradicts its expected contextual state**.

### Core Workflow:
```
Historical Chiller Dataset (CSV)
        ↓
Data Ingestion & Missing Value Imputation (Time-Series ffill/bfill)
        ↓
Contextual Feature Engineering (kW/RT, Flow/RT, Temp Deltas, Cyclic Time)
        ↓
Dual-Engine ML Detection (Random Forest Regressors + Isolation Forest)
        ↓
Contextual Anomaly Score (0 - 100) & Multi-Cycle Persistence
        ↓
Dynamic Equipment Health Index (0 - 100%)
        ↓
Evidence & Root-Cause Attribution Engine
        ↓
Actionable Engineering Recommendations
        ↓
Industrial Dark-Mode Web Dashboard
```

---

## 3. Machine Learning Methodology

### Engine 1: Contextual Expected Baseline Regressors
- Independent ensemble models ($n=50$ estimators per equipment) predict:
  - $\hat{y}_{\text{energy}} = f(\text{Building Load}, \text{Outside Temp}, \text{Dew Point}, \text{Humidity}, \text{Wind}, \text{Pressure}, \text{Time})$
  - $\hat{y}_{\text{flow}} = g(\text{Building Load}, \text{Outside Temp}, \text{Humidity}, \text{Time})$
- Residual computation: $r = y - \hat{y}$
- Studentized residual z-score: $z = \frac{r}{\sigma_{\text{residual}}}$
- Expected Normal Operating Range: $[\hat{y} - 2\sigma, \hat{y} + 2\sigma]$

### Engine 2: Multivariate Isolation Forest
- Trained on normalized vectors including:
  - Contextual parameters: Outdoor temperature, humidity, pressure, building load.
  - Thermodynamic ratios: Specific power consumption ($\text{kW/RT}$), chilled water circulation index ($\text{L/s per RT}$), and heat rejection differential ($\Delta T = T_{\text{cooling}} - T_{\text{outside}}$).
  - Contextual residuals from Engine 1.
- Identifies high-dimensional non-linear deviations.

### Engine 3: Persistence & Severity Classification
- Single isolated spikes are categorized as `ISOLATED` (Low/Medium severity).
- Consecutive anomalous intervals ($\ge 3$ cycles / $1.5+$ hours) are escalated to `PERSISTENT` with `HIGH` severity.

### Engine 4: Dynamic Equipment Health Indicator
- Computes health $H \in [0, 100]\%$ based on:
  $$H = 100 - (\text{Frequency Penalty} + \text{Severity Weight} + \text{Persistence Factor} + \text{Recency Penalty})$$
- Differentiates healthy units from degrading assets.

---

## 4. Evidence-Based Explanation & Recommendations

The system never makes unsupported claims (e.g. *"the motor is broken"*). Instead, it outputs evidence-based engineering diagnostics:
- **Actual vs Expected Metrics**: Quantified percentage deviations with normal operating bounds.
- **Supporting Evidence**: Natural language context contradictions (e.g., *"Energy consumption (141.7 kWh) is 28.8% higher than expected baseline (110.0 kWh) for a 416 RT building load"*).
- **Actionable Recommendations**: Clear investigation steps (e.g., *"Inspect chilled water valve positioning and verify evaporator approach temperature"*).

---

## 5. System Architecture

```
Yukthi/
├── backend/
│   ├── app.py                # FastAPI server, REST API & static file host
│   ├── schemas.py            # Pydantic data schemas
│   └── service.py            # ChillerService orchestrator (clean state, reset, export)
├── ml/
│   ├── preprocessor.py       # Data cleaning, time-series imputation, feature extraction
│   ├── contextual_model.py   # Dual-engine ML detector & persistence classification
│   ├── explainer.py          # Evidence builder & recommendation generator
│   └── synthetic.py          # Data contract & CSV schema template definition
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Header, dataset status badge, reset action
│   │   │   ├── OverviewCards.jsx   # Fleet KPIs (health, anomalies, energy)
│   │   │   ├── EquipmentGrid.jsx   # Chiller cards with health score gauges
│   │   │   ├── TimeSeriesChart.jsx # Interactive Recharts with anomaly dots
│   │   │   ├── AnomalyTable.jsx    # Filterable anomaly queue + CSV export
│   │   │   ├── AnomalyModal.jsx    # Diagnostic report modal
│   │   │   ├── MLInsightsModal.jsx # ML transparency & architecture modal
│   │   │   ├── EmptyOnboarding.jsx # Production onboarding zero-state
│   │   │   └── UploadModal.jsx     # CSV drag-and-drop ingestion modal
│   │   ├── App.jsx                 # Master application controller
│   │   └── index.css               # Industrial dark theme styling
└── requirements.txt          # Python dependencies
```

---

## 6. How to Run the Application

### Option A: Unified Single-Command Run (Recommended)
The FastAPI backend serves both the REST API and the compiled React production bundle:

1. **Activate Python environment & start server**:
   ```bash
   .venv\Scripts\activate
   uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload
   ```
2. Open your browser at **[http://localhost:8000](http://localhost:8000)**.

### Option B: Development Mode (Hot Reloading)
1. **Start Backend**:
   ```bash
   .venv\Scripts\activate
   python -m uvicorn backend.app:app --port 8000 --reload
   ```
2. **Start Frontend Dev Server**:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open **[http://localhost:5173](http://localhost:5173)**.

---

## 7. Supported Data Contract Specification

The application conforms to the 11-variable YUKTHI 2026 data contract:
1. `timestamp` (e.g. `2019-08-18 00:00:00`)
2. `equipment_id` (e.g. `CHILLER-01`)
3. `Chilled Water Rate (L/sec)`
4. `Cooling Water Temperature (C)`
5. `Building Load (RT)`
6. `Chiller Energy Consumption (kWh)`
7. `Outside Temperature (F)`
8. `Dew Point (F)`
9. `Humidity (%)`
10. `Wind Speed (mph)`
11. `Pressure (in)`
