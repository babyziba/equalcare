from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from analysis import analyze_csv
from datetime import datetime
import os
import subprocess

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Oxen-tracked dataset folder
OXEN_DATASET_DIR = "/Users/justinkalski/Desktop/equalcare-datasets"

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("")
):
    contents = await file.read()

    # Save file using timestamp (no category prefix to avoid duplication)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    save_path = os.path.join(OXEN_DATASET_DIR, filename)

    try:
        # Write the file
        with open(save_path, "wb") as f:
            f.write(contents)

        # Oxen versioning
        subprocess.run(["oxen", "add", filename], cwd=OXEN_DATASET_DIR, check=True)
        subprocess.run(["oxen", "commit", "-m", f"Upload: {filename}"], cwd=OXEN_DATASET_DIR, check=True)
        subprocess.run(["oxen", "push", "origin", "main"], cwd=OXEN_DATASET_DIR, check=True)

    except subprocess.CalledProcessError as e:
        return {"error": f"Failed to version file with Oxen: {str(e)}"}

    result = analyze_csv(contents, category)
    return result


@app.get("/upload-history")
def get_upload_history():
    uploads = []

    try:
        for filename in os.listdir(OXEN_DATASET_DIR):
            if filename.endswith(".csv"):
                file_path = os.path.join(OXEN_DATASET_DIR, filename)
                timestamp = os.path.getmtime(file_path)
                readable_time = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")

                # Use original upload metadata if available, otherwise fallback to a default category
                # Since we stripped category from filename, just default to "Unknown" or parse if needed
                category_guess = "Unknown"

                uploads.append({
                    "filename": filename,
                    "category": category_guess,
                    "uploaded_at": readable_time
                })

        uploads.sort(key=lambda x: x["uploaded_at"], reverse=True)
        return JSONResponse(content=uploads)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/analyze-file/{filename}")
def analyze_existing_file(filename: str, category: str = ""):
    file_path = os.path.join(OXEN_DATASET_DIR, filename)

    if not os.path.exists(file_path):
        return JSONResponse(status_code=404, content={"error": "File not found"})

    with open(file_path, "rb") as f:
        contents = f.read()

    result = analyze_csv(contents, category)
    result["filename"] = filename
    return result
