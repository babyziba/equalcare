from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from analysis import analyze_csv
from datetime import datetime
import os
import subprocess

app = FastAPI()

# Enable frontend to access the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust if frontend runs elsewhere
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to local Oxen-tracked dataset directory
OXEN_DATASET_DIR = "/Users/justinkalski/Desktop/equalcare-datasets"

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("")
):
    contents = await file.read()

    # Save file with a name based on category
    filename = f"{category.lower().replace(' ', '_')}_{file.filename}"
    save_path = os.path.join(OXEN_DATASET_DIR, filename)

    try:
        # Write the file to the Oxen-tracked directory
        with open(save_path, "wb") as f:
            f.write(contents)

        # Use Oxen to add, commit, and push the new file
        subprocess.run(["oxen", "add", filename], cwd=OXEN_DATASET_DIR, check=True)
        subprocess.run(["oxen", "commit", "-m", f"Upload: {filename}"], cwd=OXEN_DATASET_DIR, check=True)
        subprocess.run(["oxen", "push", "origin", "main"], cwd=OXEN_DATASET_DIR, check=True)

    except subprocess.CalledProcessError as e:
        return {"error": f"Failed to version file with Oxen: {str(e)}"}

    # Run your analysis logic on the uploaded content
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

                # Guess the category from the filename
                base_name = filename.rsplit(".", 1)[0]
                category_slug = "_".join(base_name.split("_")[:-1])  # everything before the last underscore
                category_guess = category_slug.replace("_", " ").title()




                uploads.append({
                    "filename": filename,
                    "category": category_guess,
                    "uploaded_at": readable_time
                })

        # Sort by most recent
        uploads.sort(key=lambda x: x["uploaded_at"], reverse=True)
        return JSONResponse(content=uploads)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
