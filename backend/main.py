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
from sentence_transformers import SentenceTransformer
from langchain_community.document_loaders import PyPDFLoader
import chromadb
import re

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RAG_PDF_DIR = "../research_papers"
RAG_DB_DIR = "../chroma_db"
EMBED_MODEL = "all-MiniLM-L6-v2"
RAG_COLLECTION_NAME = "research_docs"

print("\U0001F4DA Loading PDFs and building vector store...")
rag_docs = []
for filename in os.listdir(RAG_PDF_DIR):
    if filename.endswith(".pdf"):
        loader = PyPDFLoader(os.path.join(RAG_PDF_DIR, filename))
        rag_docs.extend(loader.load_and_split())

rag_texts = [doc.page_content for doc in rag_docs]
rag_model = SentenceTransformer(EMBED_MODEL)
rag_embeddings = rag_model.encode(rag_texts)

chroma_client = chromadb.PersistentClient(path=RAG_DB_DIR)
rag_collection = chroma_client.get_or_create_collection(RAG_COLLECTION_NAME)

if rag_collection.count() == 0:
    for i, text in enumerate(rag_texts):
        rag_collection.add(documents=[text], ids=[f"rag_doc_{i}"], embeddings=[rag_embeddings[i]])

print(f"\u2705 Loaded {len(rag_docs)} docs into vector DB.")

OXEN_DATASET_DIR = "/Users/justinkalski/Desktop/equalcare-datasets"
UPLOAD_LOG = os.path.join(OXEN_DATASET_DIR, "upload_log.json")

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

@app.delete("/upload-history")
def delete_upload_history():
    try:
        deleted = []
        for filename in os.listdir(OXEN_DATASET_DIR):
            if filename.endswith(".csv"):
                os.remove(os.path.join(OXEN_DATASET_DIR, filename))
                deleted.append(filename)
        if os.path.exists(UPLOAD_LOG):
            os.remove(UPLOAD_LOG)
        return JSONResponse(content={"message": f"Deleted {len(deleted)} files.", "files": deleted}, status_code=status.HTTP_200_OK)
    except Exception as e:
        return JSONResponse(content={"error": f"Failed to delete upload history: {str(e)}"}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RAGQuery(BaseModel):
    query: str

@app.post("/rag-query")
async def query_rag(input: RAGQuery):
    query = input.query
    query_embedding = rag_model.encode([query])[0]
    results = rag_collection.query(query_embeddings=[query_embedding], n_results=3)
    top_chunks = results["documents"][0]

    def clean_text(text):
        return re.sub(r"https?://\S+|doi:\S+|\[\d+\]|\s{2,}", " ", text).strip()

    summary_chunks = [clean_text(chunk[:500]) for chunk in top_chunks]

    prompt = (
        f"Here are some insights from related research:\n\n"
        f"{summary_chunks[0]}\n\n"
        f"{summary_chunks[1]}\n\n"
        f"{summary_chunks[2]}\n\n"
        f"The dataset mentioned below contains a gender imbalance:\n"
        f"\"{query}\"\n\n"
        f"Please write a structured summary consisting of exactly 3 sections clearly labeled:\n\n"
        f"Issue — A short explanation of why this gender imbalance is a problem in healthcare research.\n"
        f"Impact — How it might affect outcomes, diagnosis, or fairness.\n"
        f"Solution — Practical actions researchers can take to reduce or address this bias.\n\n"
        f"Return only these 3 sections, clearly labeled as: Issue, Impact, and Solution."
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    def extract_sections(text):
        issue, impact, solution = "", "", ""
        section_regex = re.compile(
            r"(Issue|Impact|Solution)\s*[:\-\u2013]?\s*(.*?)(?=\n[A-Z][a-z]+[:\-\u2013]?|\Z)",
            flags=re.IGNORECASE | re.DOTALL,
        )
        matches = section_regex.findall(text)
        for label, content in matches:
            cleaned = content.strip()
            if label.lower() == "issue":
                issue = cleaned
            elif label.lower() == "impact":
                impact = cleaned
            elif label.lower() == "solution":
                solution = cleaned
        return {
            "issue": issue or "Unable to parse issue.",
            "impact": impact or "Unable to parse impact.",
            "solution": solution or "Unable to parse solution."
        }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json={
                "model": "openchat/openchat-7b",
                "messages": [{"role": "user", "content": prompt}]
            }
        )
        response.raise_for_status()
        output = response.json()["choices"][0]["message"]["content"]
        print(f"\U0001F9D0 Prompt sent to OpenRouter:\n{prompt}")
        print(f"\u2705 AI Response:\n{output.strip()}")
        return extract_sections(output.strip())

    except Exception as e:
        return {"error": str(e)}
