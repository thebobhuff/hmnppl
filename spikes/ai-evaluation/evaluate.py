#!/usr/bin/env python3
"""AI Model Evaluation Script — Spike T007.

Runs each test scenario through multiple OpenRouter models, measuring
latency, cost, and output quality. Results are written to results.json.

Usage:
    set OPENROUTER_API_KEY=sk-or-...
    python evaluate.py

If OPENROUTER_API_KEY is not set, the script runs in DRY-RUN mode and
generates mock results for documentation purposes.

Requirements:
    pip install httpx
"""

from __future__ import annotations

import json
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SPIKE_DIR = Path(__file__).resolve().parent
SCENARIOS_PATH = SPIKE_DIR / "test_scenarios.json"
RESULTS_PATH = SPIKE_DIR / "results.json"

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Models to evaluate (OpenRouter model identifiers)
MODELS: list[dict[str, str]] = [
    {
        "id": "openai/gpt-4o-mini",
        "display_name": "GPT-4o Mini",
        "cost_per_1k_input": 0.00015,  # $0.15 / 1M tokens
        "cost_per_1k_output": 0.0006,  # $0.60 / 1M tokens
    },
    {
        "id": "meta-llama/llama-3-70b-instruct",
        "display_name": "Llama 3 70B",
        "cost_per_1k_input": 0.00065,  # ~$0.65 / 1M tokens
        "cost_per_1k_output": 0.0008,  # ~$0.80 / 1M tokens
    },
    {
        "id": "mistralai/mistral-7b-instruct",
        "display_name": "Mistral 7B",
        "cost_per_1k_input": 0.00005,  # ~$0.05 / 1M tokens
        "cost_per_1k_output": 0.00008,  # ~$0.08 / 1M tokens
    },
]

# Import prompt builder from sibling module
import sys

sys.path.insert(0, str(SPIKE_DIR))
from prompts import build_evaluation_prompt, validate_evaluation_response


# ---------------------------------------------------------------------------
# API client
# ---------------------------------------------------------------------------


def call_openrouter(
    model_id: str,
    messages: list[dict[str, str]],
    temperature: float = 0.1,
    max_tokens: int = 1024,
) -> dict[str, Any]:
    """Send a chat completion request to OpenRouter and return the result.

    Returns a dict with keys: content, latency_ms, usage, error.
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "X-Request-ID": str(uuid.uuid4()),
        "HTTP-Referer": "https://ai-hr-platform.internal",
        "X-Title": "AI HR Platform — Spike T007",
    }

    payload = {
        "model": model_id,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    start = time.perf_counter()
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
        elapsed_ms = (time.perf_counter() - start) * 1000

        body = resp.json()
        content = body["choices"][0]["message"]["content"]
        usage = body.get("usage", {})

        return {
            "content": content,
            "latency_ms": round(elapsed_ms, 1),
            "usage": usage,
            "error": None,
        }

    except httpx.HTTPStatusError as exc:
        elapsed_ms = (time.perf_counter() - start) * 1000
        return {
            "content": None,
            "latency_ms": round(elapsed_ms, 1),
            "usage": {},
            "error": f"HTTP {exc.response.status_code}: {exc.response.text[:500]}",
        }
    except Exception as exc:  # noqa: BLE001
        elapsed_ms = (time.perf_counter() - start) * 1000
        return {
            "content": None,
            "latency_ms": round(elapsed_ms, 1),
            "usage": {},
            "error": str(exc),
        }


# ---------------------------------------------------------------------------
# Dry-run mode (no API key)
# ---------------------------------------------------------------------------


def mock_call(
    model_id: str,
    scenario: dict[str, Any],
) -> dict[str, Any]:
    """Generate a deterministic mock response for dry-run mode."""
    expected = scenario["expected"]
    return {
        "content": json.dumps(
            {
                "matched_rule": expected["matched_rule"],
                "escalation_level": expected["escalation_level"],
                "action_type": expected["matched_rule"],
                "confidence": expected["confidence_range"][0],
                "reasoning": f"[DRY-RUN] Mock response for scenario {scenario['id']}",
                "policy_rule_index": 0,
            }
        ),
        "latency_ms": round(800.0 + hash(model_id) % 500, 1),
        "usage": {
            "prompt_tokens": 250,
            "completion_tokens": 80,
            "total_tokens": 330,
        },
        "error": None,
    }


# ---------------------------------------------------------------------------
# Quality scoring
# ---------------------------------------------------------------------------


def score_quality(
    parsed_response: dict[str, Any],
    expected: dict[str, Any],
) -> dict[str, Any]:
    """Compare parsed AI response against expected outcome.

    Returns a dict with match details and a composite quality score.
    """
    rule_match = parsed_response.get("matched_rule") == expected["matched_rule"]
    level_match = (
        parsed_response.get("escalation_level") == expected["escalation_level"]
    )

    confidence = parsed_response.get("confidence", 0)
    conf_min, conf_max = expected["confidence_range"]
    confidence_in_range = conf_min <= confidence <= conf_max

    # Composite: rule match = 50 points, level match = 25, confidence range = 25
    quality_score = 0
    if rule_match:
        quality_score += 50
    if level_match:
        quality_score += 25
    if confidence_in_range:
        quality_score += 25

    return {
        "rule_match": rule_match,
        "level_match": level_match,
        "confidence_in_range": confidence_in_range,
        "quality_score": quality_score,
        "details": {
            "expected_rule": expected["matched_rule"],
            "actual_rule": parsed_response.get("matched_rule"),
            "expected_level": expected["escalation_level"],
            "actual_level": parsed_response.get("escalation_level"),
            "expected_confidence_range": expected["confidence_range"],
            "actual_confidence": confidence,
        },
    }


# ---------------------------------------------------------------------------
# Cost calculation
# ---------------------------------------------------------------------------


def calculate_cost(
    model_config: dict[str, str],
    usage: dict[str, int],
) -> float:
    """Calculate the USD cost for a single API call."""
    input_tokens = usage.get("prompt_tokens", 0)
    output_tokens = usage.get("completion_tokens", 0)

    input_cost = (input_tokens / 1000) * model_config["cost_per_1k_input"]
    output_cost = (output_tokens / 1000) * model_config["cost_per_1k_output"]

    return round(input_cost + output_cost, 6)


# ---------------------------------------------------------------------------
# Main evaluation loop
# ---------------------------------------------------------------------------


def run_evaluation() -> dict[str, Any]:
    """Execute the full evaluation across all scenarios and models."""
    with open(SCENARIOS_PATH, encoding="utf-8") as f:
        scenarios_data = json.load(f)

    scenarios = scenarios_data["scenarios"]
    dry_run = not OPENROUTER_API_KEY

    results: dict[str, Any] = {
        "meta": {
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "dry_run": dry_run,
            "models_evaluated": [m["id"] for m in MODELS],
            "scenario_count": len(scenarios),
        },
        "model_summaries": [],
        "scenario_results": [],
    }

    # Per-model accumulators
    model_stats: dict[str, dict[str, Any]] = {
        m["id"]: {
            "display_name": m["display_name"],
            "total_latency_ms": 0.0,
            "total_cost_usd": 0.0,
            "total_quality": 0,
            "total_calls": 0,
            "errors": 0,
            "latencies": [],
            "qualities": [],
        }
        for m in MODELS
    }

    for scenario in scenarios:
        scenario_result: dict[str, Any] = {
            "scenario_id": scenario["id"],
            "scenario_name": scenario["name"],
            "expected": scenario["expected"],
            "model_results": [],
        }

        messages = build_evaluation_prompt(
            incident=scenario["incident"],
            employee=scenario["employee"],
            policy_rules=scenario["policy_rules"],
        )

        for model_config in MODELS:
            model_id = model_config["id"]
            stats = model_stats[model_id]

            print(
                f"  [{scenario['id']}] {model_config['display_name']:25s} ",
                end="",
                flush=True,
            )

            if dry_run:
                result = mock_call(model_id, scenario)
            else:
                result = call_openrouter(model_id, messages)

            stats["total_calls"] += 1
            stats["total_latency_ms"] += result["latency_ms"]
            stats["latencies"].append(result["latency_ms"])

            if result["error"]:
                stats["errors"] += 1
                model_result = {
                    "model": model_id,
                    "error": result["error"],
                    "latency_ms": result["latency_ms"],
                    "quality": None,
                    "cost_usd": None,
                }
                print(f"ERROR: {result['error'][:80]}")
            else:
                # Parse and validate response
                try:
                    parsed = validate_evaluation_response(result["content"])
                except ValueError as exc:
                    stats["errors"] += 1
                    model_result = {
                        "model": model_id,
                        "error": f"Validation failed: {exc}",
                        "latency_ms": result["latency_ms"],
                        "raw_response": result["content"][:500],
                        "quality": None,
                        "cost_usd": None,
                    }
                    print(f"VALIDATION ERROR: {exc}")
                    scenario_result["model_results"].append(model_result)
                    continue

                # Score quality
                quality = score_quality(parsed, scenario["expected"])
                stats["total_quality"] += quality["quality_score"]
                stats["qualities"].append(quality["quality_score"])

                # Calculate cost
                cost = calculate_cost(model_config, result["usage"])
                stats["total_cost_usd"] += cost

                model_result = {
                    "model": model_id,
                    "latency_ms": result["latency_ms"],
                    "cost_usd": cost,
                    "quality": quality,
                    "parsed_response": parsed,
                    "tokens": result["usage"],
                }
                print(
                    f"OK  latency={result['latency_ms']:.0f}ms  "
                    f"quality={quality['quality_score']}  cost=${cost:.6f}"
                )

            scenario_result["model_results"].append(model_result)

        results["scenario_results"].append(scenario_result)

    # Build model summaries
    for model_config in MODELS:
        model_id = model_config["id"]
        stats = model_stats[model_id]
        n = stats["total_calls"] or 1

        avg_quality = stats["total_quality"] / n if n else 0
        avg_latency = stats["total_latency_ms"] / n if n else 0
        max_latency = max(stats["latencies"]) if stats["latencies"] else 0
        min_latency = min(stats["latencies"]) if stats["latencies"] else 0

        results["model_summaries"].append(
            {
                "model": model_id,
                "display_name": stats["display_name"],
                "total_calls": stats["total_calls"],
                "errors": stats["errors"],
                "avg_latency_ms": round(avg_latency, 1),
                "min_latency_ms": round(min_latency, 1),
                "max_latency_ms": round(max_latency, 1),
                "avg_quality_score": round(avg_quality, 1),
                "total_cost_usd": round(stats["total_cost_usd"], 6),
                "avg_cost_per_call_usd": round(stats["total_cost_usd"] / n, 6),
                "cost_per_1k_input": model_config["cost_per_1k_input"],
                "cost_per_1k_output": model_config["cost_per_1k_output"],
            }
        )

    return results


# ---------------------------------------------------------------------------
# Production cost estimates
# ---------------------------------------------------------------------------


def estimate_production_costs(
    results: dict[str, Any],
) -> dict[str, Any]:
    """Project monthly costs based on evaluation results."""
    incidents_per_month = 100
    documents_per_month = 50

    estimates = []
    for summary in results["model_summaries"]:
        avg_cost = summary["avg_cost_per_call_usd"]

        # Estimate that documents cost ~2x evaluation (longer output)
        eval_cost = avg_cost * incidents_per_month
        doc_cost = avg_cost * 2 * documents_per_month

        estimates.append(
            {
                "model": summary["display_name"],
                "monthly_eval_cost_usd": round(eval_cost, 4),
                "monthly_doc_cost_usd": round(doc_cost, 4),
                "monthly_total_usd": round(eval_cost + doc_cost, 4),
                "annual_total_usd": round((eval_cost + doc_cost) * 12, 2),
            }
        )

    return {
        "assumptions": {
            "incidents_per_month": incidents_per_month,
            "documents_per_month": documents_per_month,
            "document_cost_multiplier": 2.0,
        },
        "estimates": estimates,
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    """Run the evaluation and write results."""
    print("=" * 70)
    print("AI HR Platform — Model Evaluation Spike (T007)")
    print("=" * 70)

    if not OPENROUTER_API_KEY:
        print()
        print("  *** DRY-RUN MODE ***")
        print("  OPENROUTER_API_KEY not set. Using mock responses.")
        print("  Set the environment variable to run against real models.")
        print()

    print(f"  Scenarios : {SCENARIOS_PATH}")
    print(f"  Output    : {RESULTS_PATH}")
    print(f"  Models    : {', '.join(m['display_name'] for m in MODELS)}")
    print()

    results = run_evaluation()
    cost_estimates = estimate_production_costs(results)
    results["production_cost_estimates"] = cost_estimates

    # Write results
    with open(RESULTS_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    # Print summary table
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print()
    print(
        f"{'Model':25s} {'Avg Latency':>12s} {'Avg Quality':>12s} {'Total Cost':>12s}"
    )
    print("-" * 70)
    for s in results["model_summaries"]:
        print(
            f"{s['display_name']:25s} "
            f"{s['avg_latency_ms']:>10.0f}ms "
            f"{s['avg_quality_score']:>12.1f} "
            f"${s['total_cost_usd']:>11.6f}"
        )

    print()
    print("Production Cost Estimates:")
    for est in cost_estimates["estimates"]:
        print(
            f"  {est['model']:25s}  "
            f"Monthly: ${est['monthly_total_usd']:.4f}  "
            f"Annual: ${est['annual_total_usd']:.2f}"
        )

    print()
    print(f"Full results written to: {RESULTS_PATH}")


if __name__ == "__main__":
    main()
