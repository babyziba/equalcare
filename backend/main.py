from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from analysis import analyze_csv


app = FastAPI()


# Allow frontend requests from localhost
app.add_middleware(
   CORSMiddleware,
   allow_origins=["http://localhost:3000"],
   allow_credentials=True,
   allow_methods=["*"],
   allow_headers=["*"],
)


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
   contents = await file.read()
   result = analyze_csv(contents)
   return result