from pydantic import BaseModel
from typing import List,Optional

class IngestRequest(BaseModel):
    text: str
    metadata: Optional[dict] = {}

class ChatRequest(BaseModel):
    query: str