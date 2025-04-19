# EqualCare

EqualCare is a web application that helps identify gender bias in healthcare datasets before they are used in machine learning models or clinical research. It provides a simple upload interface for researchers and developers to analyze their datasets for gender representation imbalance, and offers AI-powered insights on how such imbalance could impact real-world outcomes.

## Features

- Upload CSV datasets securely
- Automatically detect and normalize gender data
- Calculate gender breakdown and bias levels
- Visualize data distributions (bar/pie chart support coming soon)
- Generate plain-English explanations for detected bias using RAG (retrieval-augmented generation)
- Maintain a history of uploaded files
- Supports structured output with `issue`, `impact`, and `solution` sections

## Tech Stack

- **Frontend:** React (JavaScript)
- **Backend:** FastAPI (Python)
- **Data Analysis:** Pandas
- **AI Inference:** OpenRouter API (OpenChat 7B via RAG)
- **Embeddings:** SentenceTransformer (`all-MiniLM-L6-v2`)
- **Vector DB:** ChromaDB
- **Storage:** Supabase (buckets)
- **PDF Loader:** LangChain Community (PyPDFLoader)

## How It Works

1. Users upload a CSV file containing healthcare data.
2. The backend processes the data using Pandas, normalizing gender values and analyzing imbalance.
3. A bias level is computed based on percentage thresholds.
4. The app performs a vector similarity search on related research papers.
5. It sends a structured prompt to a hosted LLM via OpenRouter to generate:
   - Issue: What the imbalance is
   - Impact: Why it matters in real-world contexts
   - Solution: How to address or mitigate it
6. The frontend displays the breakdown and AI-generated explanation.

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/equalcare.git
cd equalcare
```

### 2. Backend Setup
- Create and activate a virtual environment
- Install dependencies
```bash
pip install -r requirements.txt
```

- Create a `.env` file with the following keys:
```
OPENROUTER_API_KEY=your_openrouter_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=your_supabase_bucket_name
```

- Start the server:
```bash
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

To build for production:
```bash
npm run build
```

## Deployment

For deployment as a unified full-stack app:

- Build the React frontend (`npm run build`)
- Serve the `/dist` folder with FastAPI using `StaticFiles`
- Configure environment variables in your deployment environment
- Optional: Use Docker for containerized deployment

## Folder Structure

```
/frontend           # React frontend app
/backend            # FastAPI backend (main app.py lives here)
/research_papers    # PDF docs used for RAG vector store
/chroma_db          # ChromaDB persistent vector DB
```

## Roadmap

- Add charting (bar/pie visualization of gender distribution)
- Add auto-detection of dataset categories (e.g., Stroke, Heart Attack)
- Expand AI reasoning to support multiple bias types
- Support multi-class gender labels
- PDF export or report download

## License

This project is open-source and available under the MIT License.
