from fastapi import FastAPI, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from analysis import analyze_csv
from datetime import datetime
import os
import subprocess
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
import json

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dataset directory & log file
OXEN_DATASET_DIR = "/Users/justinkalski/Desktop/equalcare-datasets"
UPLOAD_LOG = os.path.join(OXEN_DATASET_DIR, "upload_log.json")


# Utility to log uploads
def log_upload(filename):
    try:
        logs = []
        if os.path.exists(UPLOAD_LOG):
            with open(UPLOAD_LOG, "r") as f:
                logs = json.load(f)

        logs.append({
            "filename": filename,
            "uploaded_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

        with open(UPLOAD_LOG, "w") as f:
            json.dump(logs, f)

    except Exception as e:
        print("Failed to log upload:", e)


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), category: str = Form("")):
    contents = await file.read()

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    save_path = os.path.join(OXEN_DATASET_DIR, filename)

    try:
        with open(save_path, "wb") as f:
            f.write(contents)

        subprocess.run(["oxen", "add", filename], cwd=OXEN_DATASET_DIR, check=True)
        subprocess.run(["oxen", "commit", "-m", f"Upload: {filename}"], cwd=OXEN_DATASET_DIR, check=True)
        subprocess.run(["oxen", "push", "origin", "main"], cwd=OXEN_DATASET_DIR, check=True)

    except subprocess.CalledProcessError as e:
        return {"error": f"Failed to version file with Oxen: {str(e)}"}

    result = analyze_csv(contents, category)
    log_upload(filename)
    return result


@app.get("/upload-history")
def get_upload_history():
    try:
        if os.path.exists(UPLOAD_LOG):
            with open(UPLOAD_LOG, "r") as f:
                logs = json.load(f)
                logs.sort(key=lambda x: x["uploaded_at"], reverse=True)
                return JSONResponse(content=logs)
        else:
            return JSONResponse(content=[])
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


class ExplainBiasRequest(BaseModel):
    category: str
    gender_data: dict
    bias_level: str
    impact_note: str = ""
    source: str = ""


@app.post("/explain-bias")
async def explain_bias(payload: ExplainBiasRequest):
    # Extract gender counts
    male_count = payload.gender_data.get("male", 0)
    female_count = payload.gender_data.get("female", 0)
    total = male_count + female_count

    # Calculate percentages
    male_pct = round((male_count / total) * 100, 1) if total else 0
    female_pct = round((female_count / total) * 100, 1) if total else 0

    # Describe bias level contextually
    if payload.bias_level == "significant_bias":
        bias_comment = "This represents a significant imbalance that could seriously affect results."
    elif payload.bias_level == "mild_imbalance":
        bias_comment = "There is a mild imbalance in representation, which may still influence findings."
    else:
        bias_comment = "The dataset appears fairly balanced."

    # Construct smart prompt
    prompt = f"""
You are a data-aware healthcare bias expert. Analyze the gender representation in this dataset and infer what clinical risks or research issues it may introduce.

Dataset Category: {payload.category}
Gender Breakdown:
- Male: {male_count} entries ({male_pct}%)
- Female: {female_count} entries ({female_pct}%)
Bias Level: {payload.bias_level}
{bias_comment}

Explain how this imbalance might skew research findings, affect diagnostic accuracy, or create unfair treatment outcomes — especially for the underrepresented group.

{f"Additional Insight: {payload.impact_note}" if payload.impact_note else ""}
{f"Source: {payload.source}" if payload.source else ""}
"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": [{"role": "user", "content": prompt}]
    }

    try:
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        return {"explanation": content.strip()}
    except Exception as e:
        return {"error": str(e)}


@app.delete("/upload-history")
def delete_upload_history():
    try:
        deleted = []
        for filename in os.listdir(OXEN_DATASET_DIR):
            if filename.endswith(".csv"):
                file_path = os.path.join(OXEN_DATASET_DIR, filename)
                os.remove(file_path)
                deleted.append(filename)

        if os.path.exists(UPLOAD_LOG):
            os.remove(UPLOAD_LOG)

        return JSONResponse(
            content={"message": f"Deleted {len(deleted)} files.", "files": deleted},
            status_code=status.HTTP_200_OK
        )
    except Exception as e:
        return JSONResponse(
            content={"error": f"Failed to delete upload history: {str(e)}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
