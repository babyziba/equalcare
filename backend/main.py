from fastapi import FastAPI, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from analysis import analyze_csv
from datetime import datetime
import os
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
import json
from sentence_transformers import SentenceTransformer
from langchain_community.document_loaders import PyPDFLoader
import chromadb
import re
from supabase import create_client, Client

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL and Service Role Key must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RAG setup
RAG_PDF_DIR = "../research_papers"
RAG_DB_DIR = "../chroma_db"
EMBED_MODEL = "all-MiniLM-L6-v2"
RAG_COLLECTION_NAME = "research_docs"

print("📚 Loading PDFs and building vector store...")
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

print(f"✅ Loaded {len(rag_docs)} docs into vector DB.")

UPLOAD_LOG = "upload_log.json"

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

class RAGQuery(BaseModel):
    dataset_name: str
    bias_level: str
    gender_breakdown: dict
    gender_percentages: dict
    total_entries: int

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), category: str = Form("")):
    contents = await file.read()
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"

    try:
        res = supabase.storage.from_(SUPABASE_BUCKET).upload(filename, contents, {"content-type": "text/csv"})
        if hasattr(res, 'error') and res.error:
            raise Exception(res.error.message)
    except Exception as e:
        return {"error": f"Failed to upload to Supabase: {str(e)}"}

    result = analyze_csv(contents, category)
    log_upload(filename)
    return result

@app.get("/analyze-file/{filename}")
def analyze_existing_file(filename: str, category: str = ""):
    try:
        response = supabase.storage.from_(SUPABASE_BUCKET).download(filename)
        file_bytes = response  
        result = analyze_csv(file_bytes, category)
        result["filename"] = filename
        return result
    except Exception as e:
        print("Error re-analyzing file:", str(e))
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to re-analyze file from Supabase: {str(e)}"},
        )

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

@app.delete("/upload-history")
def delete_upload_history():
    try:
        if os.path.exists(UPLOAD_LOG):
            os.remove(UPLOAD_LOG)
        return JSONResponse(content={"message": "Upload log deleted."}, status_code=status.HTTP_200_OK)
    except Exception as e:
        return JSONResponse(content={"error": f"Failed to delete upload history: {str(e)}"}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@app.post("/rag-query")
async def query_rag(input: RAGQuery):
    # Prepare the dataset context
    dataset_summary = (
        f'Dataset Name: "{input.dataset_name}"\n'
        f"Total Entries: {input.total_entries}\n"
        f"Male: {input.gender_breakdown.get('male', 0)} "
        f"({input.gender_percentages.get('male', 0)}%)\n"
        f"Female: {input.gender_breakdown.get('female', 0)} "
        f"({input.gender_percentages.get('female', 0)}%)\n"
        f"Bias Level: {input.bias_level}"
    )

    query_embedding = rag_model.encode([dataset_summary])[0]
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
        f"The dataset under review has the following summary:\n"
        f"{dataset_summary}\n\n"
        f"Based on the above, return a JSON object with keys 'issue', 'impact', and 'solution'. "
        f"Each key should contain a plain English paragraph. No markdown, no labels — just valid JSON."
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
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

        print(f"🧐 Prompt sent to OpenRouter:\n{prompt}")
        print(f"✅ AI Response:\n{output.strip()}")

        try:
            json_block = re.search(r'{.*}', output, re.DOTALL).group(0)
            structured = json.loads(json_block)
        except Exception as e:
            print("⚠️ Failed to parse JSON from model response:", e)
            structured = {
                "issue": "AI response did not return structured JSON.",
                "impact": "Cannot parse impact due to formatting issue.",
                "solution": "Please try re-uploading or re-analyzing the dataset."
            }

        return structured
    except Exception as e:
        return {"error": str(e)}
