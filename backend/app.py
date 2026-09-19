import os
import shutil
import logging
from fastapi import FastAPI, UploadFile, File, Query, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any

from backend.service import ChillerService

# Configure production logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("chiller_ai.server")

app = FastAPI(
    title="Chiller AI Contextual Anomaly Detection API",
    description="Contextual Machine Learning Platform for Industrial Chiller Fleet Health & Anomaly Diagnostics",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize production service singleton with NO default demo dataset
service = ChillerService()

@app.get("/api/health")
def get_health():
    is_active = service.processed_df is not None and len(service.processed_df) > 0
    return {
        "status": "ok",
        "service": "chiller-ai",
        "mode": "production",
        "dataset_active": is_active,
        "dataset_source": service.source_label,
        "records": len(service.processed_df) if is_active else 0
    }

@app.get("/api/overview")
def get_overview():
    return service.get_overview()

@app.get("/api/equipments")
def get_equipments():
    return service.get_equipments()

@app.get("/api/equipment/{equipment_id}/timeseries")
def get_timeseries(
    equipment_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    max_points: int = Query(1200, ge=100, le=5000)
):
    data = service.get_timeseries(equipment_id, start_date=start_date, end_date=end_date, max_points=max_points)
    return data

@app.get("/api/anomalies")
def get_anomalies(
    equipment_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    return service.get_anomalies(equipment_id=equipment_id, severity=severity, limit=limit, offset=offset)

@app.get("/api/anomaly/{anomaly_id}")
def get_anomaly_detail(anomaly_id: int):
    detail = service.get_anomaly_detail(anomaly_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Anomaly with id {anomaly_id} not found")
    return detail

@app.get("/api/ml-insights")
def get_ml_insights():
    return service.get_ml_insights()

@app.get("/api/template-csv")
def download_csv_template():
    csv_content = service.get_csv_template()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=chiller_telemetry_template.csv"}
    )

@app.get("/api/export-anomalies")
def export_anomalies():
    csv_content = service.export_anomalies_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=detected_anomalies.csv"}
    )

@app.post("/api/dataset/reset")
def reset_dataset():
    logger.info("Resetting dataset to clean uninitialized state.")
    service.reset_dataset()
    return {"status": "success", "message": "Dataset cleared", "overview": service.get_overview()}

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")
        
    os.makedirs("uploads", exist_ok=True)
    temp_path = os.path.join("uploads", f"facility_telemetry_{file.filename}")
    
    try:
        logger.info(f"Receiving file upload: {file.filename} (Auto-analyzing chiller contents)")
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size = os.path.getsize(temp_path)
        if file_size > 100 * 1024 * 1024:  # 100MB limit
            raise ValueError("File size exceeds production limit (100MB).")
            
        service.load_from_csv(temp_path, source_label=file.filename)
        logger.info(f"Successfully processed dataset {file.filename} with {len(service.processed_df)} records across {len(service.equipment_counts)} units: {list(service.equipment_counts.keys())}.")
        return {
            "status": "success",
            "message": f"Successfully ingested and analyzed {file.filename}",
            "equipment_breakdown": service.equipment_counts,
            "overview": service.get_overview()
        }
    except Exception as e:
        logger.error(f"Error processing CSV: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

# Mount static frontend build if it exists
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
