from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import GPT2LMHeadModel, GPT2Tokenizer
from fastapi.middleware.cors import CORSMiddleware
import torch
import logging
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the model and tokenizer
model_name = "gpt2"
model = GPT2LMHeadModel.from_pretrained(model_name)
tokenizer = GPT2Tokenizer.from_pretrained(model_name)

# Set pad_token_id to eos_token_id to prevent issues
model.config.pad_token_id = model.config.eos_token_id
tokenizer.pad_token = tokenizer.eos_token

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Only allow requests from localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request schema
class Character(BaseModel):
    displayName: str
    characteristics: str
    occupation: str
    relationship: str

class DialogueRequest(BaseModel):
    context: str
    characters: List[Character]
    length: str

# Map length to max tokens
length_map = {"short": 50, "medium": 100, "long": 200}

@app.post("/generate-dialogue")
def generate_dialogue(request: DialogueRequest):
    context = request.context
    characters = request.characters
    length = request.length

    if length not in length_map:
        raise HTTPException(status_code=400, detail="Invalid length value")

    if not characters or not context:
        raise HTTPException(
            status_code=400, detail="Context or characters cannot be empty"
        )

    # Generate character profiles
    profiles = "\n".join(
        [
            f"{char.displayName}: {char.characteristics} ({char.occupation}). {char.relationship}"
            for char in characters
        ]
    )

    # Construct prompt
    prompt = f"Context: {context}\nCharacters:\n{profiles}\nDialogue:\n"
    logger.info(f"Generated prompt: {prompt}")

    try:
        # Tokenize input and create attention mask
        inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True)
        input_ids = inputs["input_ids"]
        attention_mask = inputs["attention_mask"]
        max_new_tokens = length_map[length]

        # Generate dialogue with adjusted parameters
        outputs = model.generate(
            input_ids,
            attention_mask=attention_mask,
            max_new_tokens=max_new_tokens,
            num_return_sequences=1,
            temperature=0.9,  # Adjust temperature for more randomness
            top_k=50,         # Use top_k sampling
            top_p=0.95,       # Use top_p sampling
            do_sample=True    # Enable sampling
        )
        dialogue = tokenizer.decode(outputs[0], skip_special_tokens=True)
        logger.info(f"Generated dialogue: {dialogue}")

        # Post-process the dialogue to remove repetition and improve coherence
        dialogue = post_process_dialogue(dialogue)
        logger.info(f"Post-processed dialogue: {dialogue}")

        return {"dialogue": dialogue}
    except Exception as e:
        logger.error(f"Error generating dialogue: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error generating dialogue: {str(e)}"
        )

def post_process_dialogue(dialogue):
    # Example post-processing steps
    lines = dialogue.split("\n")
    cleaned_lines = []
    for line in lines:
        if line not in cleaned_lines:
            cleaned_lines.append(line)
    return "\n".join(cleaned_lines)