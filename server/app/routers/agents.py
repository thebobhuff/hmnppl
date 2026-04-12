import logging
import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.core.security import validate_api_key
from app.schemas.agents import DecomposeHandbookRequest
from app.services.ai_router import AIRouter
from app.services.output_validator import parse_json_output
from app.services.supabase_client import get_supabase_client

router = APIRouter(
    prefix="/agents",
    tags=["agents"],
    dependencies=[Depends(validate_api_key)],
)

logger = logging.getLogger(__name__)


class PolicyChatRequest(BaseModel):
    message: str = Field(..., max_length=1000)
    company_id: str | None = None
    employee_id: str | None = None


@router.post("/policy-chat")
async def policy_chat(
    body: PolicyChatRequest,
    settings: Settings = Depends(get_settings),
):
    start_time = time.monotonic()

    try:
        router_instance = AIRouter(settings)
        supabase = get_supabase_client()

        # 1. Embed the query
        embeddings = await router_instance.get_embeddings([body.message])
        if not embeddings:
            raise HTTPException(status_code=500, detail="Failed to embed query")

        query_embedding = embeddings[0]

        # 2. Similarity Search against Postgres
        rpc_result = supabase.rpc(
            "match_policies",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.4,
                "match_count": 3,
                "company_id_filter": body.company_id,
            },
        ).execute()

        context_texts = []
        if rpc_result and hasattr(rpc_result, "data") and rpc_result.data:
            for match in rpc_result.data:
                context_texts.append(
                    f"Policy: {match.get('metadata', {}).get('policy_title', 'Unknown')}\nContent: {match.get('content', '')}"
                )

        merged_context = (
            "\n\n".join(context_texts)
            if context_texts
            else "No matching policies found."
        )

        # 3. Create RAG prompt
        system_prompt = (
            "You are a helpful, professional HR assistant for employees. "
            "You must answer their questions based ONLY on the provided policy context below. "
            "If the context does not contain the answer, say 'I cannot find the answer in the current HR policies.' "
            "Do not invent or hallucinate policies."
        )

        user_prompt = (
            f"Context:\n{merged_context}\n\nEmployee Question:\n{body.message}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        # 4. Generate Answer
        result = await router_instance.call(
            messages=messages,
            model="openrouter:meta-llama/llama-3-8b-instruct",
            temperature=0.0,
            max_tokens=1000,
        )

        elapsed = time.monotonic() - start_time

        return {
            "answer": result["content"],
            "meta": {
                "model": result["model"],
                "cost_usd": result["cost"],
                "latency_ms": round(elapsed * 1000, 2),
            },
        }

    except Exception as e:
        logger.exception("Policy chat agent failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/handbook-decompose")
async def decompose_handbook(
    body: DecomposeHandbookRequest,
    settings: Settings = Depends(get_settings),
):
    start_time = time.monotonic()
    router_instance = AIRouter(settings)
    supabase = get_supabase_client()

    try:
        system_prompt = (
            "You are an expert HR and Compliance AI. "
            "You have been given the raw text of an employee handbook. "
            "Your job is to read it carefully and decompose it into distinct, self-contained sections representing individual policies (e.g., PTO, Code of Conduct, Travel Expenses, Anti-Harassment). "
            "Respond ONLY with a valid JSON array of objects. Each object MUST have: "
            "1. 'title': A clear title for the policy. "
            "2. 'category': One of ['general', 'conduct', 'time_off', 'benefits', 'safety', 'other']. "
            "3. 'summary': A one-sentence summary of the policy. "
            "4. 'content': The FULL original text and context pertaining to this policy from the handbook. "
        )

        user_prompt = f"Employee Handbook Text:\n{body.handbook_text}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        # Use an advanced model capable of processing large contexts and JSON reliably
        result = await router_instance.call(
            messages=messages,
            model="openrouter:meta-llama/llama-3-8b-instruct",
            temperature=0.1,
            max_tokens=8000,
        )

        # Parse json
        policies_data = parse_json_output(result["content"])
        if not isinstance(policies_data, list):
            raise HTTPException(
                status_code=400, detail="AI did not return a valid list of policies"
            )

        extracted_policies = []
        for p in policies_data:
            # Upsert logic to supabase or just return for frontend confirmation
            extracted_policies.append(
                {
                    "title": p.get("title", "Untitled Policy"),
                    "category": p.get("category", "general"),
                    "summary": p.get("summary", ""),
                    "content": p.get("content", ""),
                }
            )

        if supabase and body.company_id and extracted_policies:
            # 1. Insert policies
            saved_policies = []
            for ep in extracted_policies:
                pol_resp = (
                    supabase.table("policies")
                    .insert(
                        {
                            "company_id": body.company_id,
                            "title": ep["title"],
                            "category": ep["category"],
                            "summary": ep["summary"],
                            "content": ep["content"],
                            "is_active": True,
                        }
                    )
                    .execute()
                )

                if pol_resp and hasattr(pol_resp, "data") and pol_resp.data:
                    record = pol_resp.data[0]
                    saved_policies.append(record)

            # 2. Insert Embeddings using AI Router
            if saved_policies:
                texts_to_embed = [sp["content"] for sp in saved_policies]
                try:
                    embeddings = await router_instance.get_embeddings(texts_to_embed)
                    for i, sp in enumerate(saved_policies):
                        supabase.table("policy_embeddings").insert(
                            {
                                "policy_id": sp["id"],
                                "company_id": body.company_id,
                                "content": sp["content"],
                                "embedding": embeddings[i],
                            }
                        ).execute()
                except Exception as e:
                    logger.warning(f"Failed to generate/store embeddings: {e}")

        elapsed = time.monotonic() - start_time

        return {
            "message": f"Successfully decomposed handbook into {len(extracted_policies)} policies.",
            "policies_count": len(extracted_policies),
            "policies": extracted_policies,
            "meta": {
                "model": result["model"],
                "cost_usd": result["cost"],
                "latency_ms": round(elapsed * 1000, 2),
            },
        }

    except Exception as e:
        logger.exception("Handbook decomposition failed")
        raise HTTPException(status_code=500, detail=str(e))
