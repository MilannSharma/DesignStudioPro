from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslationRequest(BaseModel):
    text: str
    target_lang: str

MODEL_NAME = "ai4bharat/indictrans2-en-indic-1B"

print(f"Loading {MODEL_NAME}...")
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, trust_remote_code=True)
    if torch.cuda.is_available():
        model = model.cuda()
    model.eval()
    print("Model loaded successfully!")
except Exception as e:
    print(f"Failed to load model: {e}")

@app.post("/translate")
async def translate(req: TranslationRequest):
    if not req.text:
        return {"translated_text": ""}
        
    try:
        inputs = tokenizer(req.text, return_tensors="pt", padding=True, truncation=True, max_length=256)
        
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
            
        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=256, num_beams=5)
            
        translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return {"translated_text": translated_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
