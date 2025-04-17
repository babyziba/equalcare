from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from analysis import analyze_csv
import os
import subprocess

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to your synced Oxen repo
OXEN_DATASET_DIR = "/Users/justinkalski/Desktop/equalcare-datasets"

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("")
):
    contents = await file.read()

    # Format filename using category
    filename = f"{category.lower().replace(' ', '_')}_{file.filename}"
    save_path = os.path.join(OXEN_DATASET_DIR, filename)

    try:
        # Save the file locally
        with open(save_path, "wb") as f:
            f.write(contents)

        # Run Oxen commands
        subprocess.run(["oxen", "add", filename], cwd=OXEN_DATASET_DIR, check=True)
        subprocess.run(["oxen", "commit", "-m", f"Upload: {filename}"], cwd=OXEN_DATASET_DIR, check=True)
        subprocess.run(["oxen", "push", "origin", "main"], cwd=OXEN_DATASET_DIR, check=True)

    except subprocess.CalledProcessError as e:
        return {"error": f"Failed to version file with Oxen: {str(e)}"}

    # Continue to run your analysis as before
    result = analyze_csv(contents, category)
    return result
