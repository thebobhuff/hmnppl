from pydantic import BaseModel, Field


class DecomposeHandbookRequest(BaseModel):
    handbook_text: str = Field(..., max_length=150000)
    company_id: str | None = None
